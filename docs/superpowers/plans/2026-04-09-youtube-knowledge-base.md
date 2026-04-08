# YouTube-to-Knowledge-Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the PawBalance recipe analysis agent with veterinary nutrition knowledge from Dr. Judy Morgan's YouTube channel via RAG (Retrieval-Augmented Generation).

**Architecture:** A standalone Python script transcribes ~500 YouTube videos, chunks and embeds them with `nomic-embed-text-v2-moe` via Ollama, and uploads to Supabase pgvector. At query time, the recipe analysis API route embeds the ingredient list via an Ollama sidecar, retrieves the top 5 relevant chunks from Supabase, and injects them into the agent's system prompt.

**Tech Stack:** Python 3.11+ (pipeline), youtube-transcript-api, yt-dlp, faster-whisper, SpaCy, Ollama (nomic-embed-text-v2-moe), Supabase pgvector, Next.js API routes, Helm/ArgoCD

**Spec:** `docs/superpowers/specs/2026-04-09-youtube-knowledge-base-design.md`

---

## File Structure

### New files:
- `scripts/youtube-knowledge-base/requirements.txt` — Python dependencies
- `scripts/youtube-knowledge-base/ingest.py` — Main pipeline script (fetch → chunk → embed → upload)
- `scripts/youtube-knowledge-base/.env.example` — Environment template
- `supabase/migrations/002_video_chunks.sql` — Table, index, RPC function
- `src/lib/embeddings.ts` — Ollama embed + Supabase vector search utilities
- `refs/gitops/helm/pawbalance/templates/ollama-deployment.yaml` — Ollama K8s deployment
- `refs/gitops/helm/pawbalance/templates/ollama-service.yaml` — Ollama K8s service
- `refs/gitops/helm/pawbalance/templates/ollama-pvc.yaml` — Persistent volume for model

### Modified files:
- `src/lib/agent/system-prompt.ts` — Accept and render knowledge context
- `src/app/api/recipes/analyze/route.ts` — Add retrieval step before agent invocation
- `refs/gitops/helm/pawbalance/values.yaml` — Add Ollama config section
- `refs/gitops/helm/pawbalance/templates/deployment.yaml` — Add OLLAMA_URL env var

---

## Task 1: Supabase Migration — video_chunks table + RPC

**Files:**
- Create: `supabase/migrations/002_video_chunks.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/002_video_chunks.sql
-- Stores embedded transcript chunks from YouTube videos for RAG retrieval

create extension if not exists vector;

create table video_chunks (
  id bigserial primary key,
  video_id text not null,
  video_title text not null,
  chunk_index integer not null,
  content text not null,
  token_count integer not null,
  timestamp_start integer,
  timestamp_end integer,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

create index idx_video_chunks_embedding
  on video_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index idx_video_chunks_video_id
  on video_chunks (video_id);

create or replace function search_video_chunks(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  video_title text,
  similarity float
)
as $$
  select
    vc.id,
    vc.content,
    vc.video_title,
    1 - (vc.embedding <=> query_embedding) as similarity
  from video_chunks vc
  order by vc.embedding <=> query_embedding
  limit match_count;
$$ language sql;
```

- [ ] **Step 2: Apply migration to Supabase**

Run this SQL in the Supabase dashboard SQL editor (or via `supabase db push` if using the CLI). Verify:

```sql
select count(*) from information_schema.tables where table_name = 'video_chunks';
-- Expected: 1

select proname from pg_proc where proname = 'search_video_chunks';
-- Expected: search_video_chunks
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_video_chunks.sql
git commit -m "feat: add video_chunks table and search RPC for RAG"
```

---

## Task 2: Python Transcription Pipeline

**Files:**
- Create: `scripts/youtube-knowledge-base/requirements.txt`
- Create: `scripts/youtube-knowledge-base/.env.example`
- Create: `scripts/youtube-knowledge-base/ingest.py`

- [ ] **Step 1: Create requirements.txt**

```
youtube-transcript-api>=1.0.0
yt-dlp>=2024.0.0
faster-whisper>=1.1.0
spacy>=3.8.0
supabase>=2.0.0
python-dotenv>=1.0.0
requests>=2.32.0
```

- [ ] **Step 2: Create .env.example**

```
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
SUPABASE_URL=https://wfruynvxajqbosiharmy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OLLAMA_URL=http://localhost:11434
CHANNEL_HANDLE=@DrJudyMorgan
```

- [ ] **Step 3: Write the ingest script**

```python
#!/usr/bin/env python3
"""
YouTube-to-Knowledge-Base Ingest Pipeline
Fetches transcripts from a YouTube channel, chunks them, embeds with Ollama,
and uploads to Supabase pgvector.
"""

import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import requests
import spacy
from dotenv import load_dotenv
from supabase import create_client
from youtube_transcript_api import YouTubeTranscriptApi

load_dotenv()

YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
CHANNEL_HANDLE = os.environ.get("CHANNEL_HANDLE", "@DrJudyMorgan")
EMBED_MODEL = "nomic-embed-text-v2-moe"
CHUNK_SIZE = 400  # tokens
CHUNK_OVERLAP = 50  # tokens
BATCH_SIZE = 50  # chunks per Supabase insert


@dataclass
class Chunk:
    video_id: str
    video_title: str
    chunk_index: int
    content: str
    token_count: int
    timestamp_start: int | None
    timestamp_end: int | None


def get_channel_id(handle: str) -> str:
    """Resolve a YouTube handle to a channel ID."""
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {"part": "snippet", "q": handle, "type": "channel", "key": YOUTUBE_API_KEY}
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    items = resp.json().get("items", [])
    if not items:
        raise ValueError(f"Channel not found: {handle}")
    return items[0]["snippet"]["channelId"]


def get_all_video_ids(channel_id: str) -> list[dict]:
    """Fetch all video IDs and titles from a channel via YouTube Data API v3."""
    videos = []
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "channelId": channel_id,
        "type": "video",
        "maxResults": 50,
        "order": "date",
        "key": YOUTUBE_API_KEY,
    }
    while True:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("items", []):
            videos.append({
                "video_id": item["id"]["videoId"],
                "title": item["snippet"]["title"],
            })
        next_page = data.get("nextPageToken")
        if not next_page:
            break
        params["pageToken"] = next_page
        time.sleep(0.5)  # rate limit courtesy
    return videos


def fetch_transcript(video_id: str) -> list[dict] | None:
    """Try to fetch YouTube captions. Returns list of segments or None."""
    try:
        segments = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        return segments
    except Exception:
        return None


def transcribe_with_whisper(video_id: str) -> list[dict] | None:
    """Download audio with yt-dlp, transcribe with faster-whisper."""
    audio_path = f"/tmp/{video_id}.mp3"
    try:
        subprocess.run(
            ["yt-dlp", "-x", "--audio-format", "mp3", "-o", audio_path,
             f"https://www.youtube.com/watch?v={video_id}"],
            check=True, capture_output=True,
        )
        from faster_whisper import WhisperModel
        model = WhisperModel("base", compute_type="int8")
        segments_iter, _ = model.transcribe(audio_path)
        segments = [{"text": s.text, "start": s.start, "duration": s.end - s.start}
                    for s in segments_iter]
        return segments if segments else None
    except Exception as e:
        print(f"  Whisper fallback failed for {video_id}: {e}")
        return None
    finally:
        Path(audio_path).unlink(missing_ok=True)


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~0.75 tokens per word for English."""
    return int(len(text.split()) * 1.33)


def chunk_transcript(
    video_id: str, video_title: str, segments: list[dict], nlp
) -> list[Chunk]:
    """Chunk transcript segments into ~400 token pieces at sentence boundaries."""
    full_text = " ".join(seg["text"].strip() for seg in segments)
    doc = nlp(full_text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    # Build a timestamp lookup: map character offset → timestamp
    char_to_time: dict[int, float] = {}
    offset = 0
    for seg in segments:
        text = seg["text"].strip()
        char_to_time[offset] = seg["start"]
        offset += len(text) + 1  # +1 for space

    chunks: list[Chunk] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = estimate_tokens(sentence)
        if current_tokens + sent_tokens > CHUNK_SIZE and current_sentences:
            chunk_text = " ".join(current_sentences)

            # Find approximate timestamp for chunk start
            chunk_start_char = full_text.find(current_sentences[0])
            ts_start = None
            for char_off in sorted(char_to_time.keys()):
                if char_off <= chunk_start_char:
                    ts_start = int(char_to_time[char_off])
                else:
                    break

            chunks.append(Chunk(
                video_id=video_id,
                video_title=video_title,
                chunk_index=len(chunks),
                content=chunk_text,
                token_count=current_tokens,
                timestamp_start=ts_start,
                timestamp_end=None,
            ))

            # Overlap: keep last few sentences
            overlap_tokens = 0
            overlap_sentences: list[str] = []
            for s in reversed(current_sentences):
                t = estimate_tokens(s)
                if overlap_tokens + t > CHUNK_OVERLAP:
                    break
                overlap_sentences.insert(0, s)
                overlap_tokens += t
            current_sentences = overlap_sentences
            current_tokens = overlap_tokens

        current_sentences.append(sentence)
        current_tokens += sent_tokens

    # Final chunk
    if current_sentences:
        chunk_text = " ".join(current_sentences)
        chunk_start_char = full_text.find(current_sentences[0])
        ts_start = None
        for char_off in sorted(char_to_time.keys()):
            if char_off <= chunk_start_char:
                ts_start = int(char_to_time[char_off])
            else:
                break
        chunks.append(Chunk(
            video_id=video_id,
            video_title=video_title,
            chunk_index=len(chunks),
            content=chunk_text,
            token_count=current_tokens,
            timestamp_start=ts_start,
            timestamp_end=None,
        ))

    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts via Ollama API."""
    resp = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": EMBED_MODEL, "input": texts},
    )
    resp.raise_for_status()
    return resp.json()["embeddings"]


def upload_chunks(supabase, chunks: list[Chunk], embeddings: list[list[float]]):
    """Batch insert chunks with embeddings into Supabase."""
    rows = []
    for chunk, emb in zip(chunks, embeddings):
        rows.append({
            "video_id": chunk.video_id,
            "video_title": chunk.video_title,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "token_count": chunk.token_count,
            "timestamp_start": chunk.timestamp_start,
            "timestamp_end": chunk.timestamp_end,
            "embedding": emb,
        })
    supabase.table("video_chunks").insert(rows).execute()


def main():
    print(f"=== YouTube Knowledge Base Ingest ===")
    print(f"Channel: {CHANNEL_HANDLE}")
    print(f"Embed model: {EMBED_MODEL}")
    print()

    # Verify Ollama is running
    try:
        requests.get(f"{OLLAMA_URL}/api/tags")
    except requests.ConnectionError:
        print(f"ERROR: Ollama not running at {OLLAMA_URL}")
        print(f"Start it with: ollama serve")
        sys.exit(1)

    # Load SpaCy model
    print("Loading SpaCy model...")
    nlp = spacy.load("en_core_web_sm")

    # Init Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Check for already-ingested videos
    existing = supabase.table("video_chunks").select("video_id").execute()
    existing_ids = set(row["video_id"] for row in existing.data)
    print(f"Already ingested: {len(existing_ids)} videos")

    # Get all videos from channel
    print(f"Fetching video list from {CHANNEL_HANDLE}...")
    channel_id = get_channel_id(CHANNEL_HANDLE)
    videos = get_all_video_ids(channel_id)
    print(f"Found {len(videos)} videos total")

    # Filter out already-ingested
    new_videos = [v for v in videos if v["video_id"] not in existing_ids]
    print(f"New videos to process: {len(new_videos)}")
    print()

    total_chunks = 0
    failed = []

    for i, video in enumerate(new_videos):
        vid = video["video_id"]
        title = video["title"]
        print(f"[{i+1}/{len(new_videos)}] {title}")

        # Try YouTube captions first
        segments = fetch_transcript(vid)
        source = "captions"

        # Fallback to Whisper
        if segments is None:
            print("  No captions, trying Whisper...")
            segments = transcribe_with_whisper(vid)
            source = "whisper"

        if segments is None:
            print("  SKIPPED: no transcript available")
            failed.append(vid)
            continue

        print(f"  Transcript: {source}, {len(segments)} segments")

        # Chunk
        chunks = chunk_transcript(vid, title, segments, nlp)
        print(f"  Chunks: {len(chunks)}")

        if not chunks:
            continue

        # Embed in batches
        all_embeddings: list[list[float]] = []
        texts = [c.content for c in chunks]
        for j in range(0, len(texts), BATCH_SIZE):
            batch = texts[j:j + BATCH_SIZE]
            embs = embed_texts(batch)
            all_embeddings.extend(embs)

        # Upload
        upload_chunks(supabase, chunks, all_embeddings)
        total_chunks += len(chunks)
        print(f"  Uploaded {len(chunks)} chunks")

    print()
    print(f"=== Done ===")
    print(f"Total new chunks: {total_chunks}")
    if failed:
        print(f"Failed videos ({len(failed)}): {failed}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Set up Python environment and install dependencies**

```bash
cd scripts/youtube-knowledge-base
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

- [ ] **Step 5: Pull the Ollama model**

```bash
ollama pull nomic-embed-text-v2-moe
```

Verify it works:

```bash
curl http://localhost:11434/api/embed -d '{"model":"nomic-embed-text-v2-moe","input":["test"]}'
```

Expected: JSON response with `embeddings` array containing one 768-dimensional vector.

- [ ] **Step 6: Create .env from .env.example and fill in real values**

```bash
cp .env.example .env
# Edit .env with your YouTube Data API key and Supabase service role key
```

- [ ] **Step 7: Run the pipeline**

```bash
python ingest.py
```

Expected output:
```
=== YouTube Knowledge Base Ingest ===
Channel: @DrJudyMorgan
Embed model: nomic-embed-text-v2-moe

Loading SpaCy model...
Already ingested: 0 videos
Fetching video list from @DrJudyMorgan...
Found ~500 videos total
New videos to process: ~500

[1/500] Video Title Here
  Transcript: captions, 142 segments
  Chunks: 8
  Uploaded 8 chunks
...
=== Done ===
Total new chunks: ~XXXXX
```

- [ ] **Step 8: Verify data in Supabase**

Run in Supabase SQL editor:

```sql
select count(*) from video_chunks;
-- Expected: several thousand rows

select video_title, count(*) as chunks
from video_chunks
group by video_title
order by chunks desc
limit 5;
-- Expected: top 5 videos with chunk counts
```

- [ ] **Step 9: Commit**

```bash
git add scripts/youtube-knowledge-base/
git commit -m "feat: add YouTube transcript ingest pipeline for RAG"
```

---

## Task 3: Embeddings Utility Module

**Files:**
- Create: `src/lib/embeddings.ts`

- [ ] **Step 1: Write the embeddings utility**

```typescript
// src/lib/embeddings.ts

import { createClient } from "@supabase/supabase-js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text-v2-moe";

/**
 * Embed a text string via Ollama API.
 * Returns a 768-dimensional float array.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const resp = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: [text] }),
  });

  if (!resp.ok) {
    throw new Error(`Ollama embed failed: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.embeddings[0];
}

/**
 * Search video_chunks table for the most relevant transcript chunks.
 */
export async function searchVideoChunks(
  queryEmbedding: number[],
  matchCount: number = 5
): Promise<{ content: string; video_title: string; similarity: number }[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc("search_video_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: matchCount,
  });

  if (error) {
    console.error("search_video_chunks error:", error);
    return [];
  }

  return data ?? [];
}

/**
 * High-level: given a list of ingredient names, retrieve relevant
 * veterinary nutrition knowledge from the video transcript corpus.
 */
export async function getRelevantKnowledge(
  ingredients: string[]
): Promise<string[]> {
  const query = ingredients.join(", ");
  const embedding = await embedQuery(query);
  const chunks = await searchVideoChunks(embedding, 5);
  return chunks.map((c) => c.content);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/embeddings.ts
git commit -m "feat: add embeddings utility for RAG retrieval"
```

---

## Task 4: Update System Prompt to Accept Knowledge Context

**Files:**
- Modify: `src/lib/agent/system-prompt.ts`

- [ ] **Step 1: Update buildSystemPrompt to accept knowledgeContext**

The current function signature is `buildSystemPrompt(locale: string)`. Change it to accept an optional knowledge context parameter and append it to the prompt.

In `src/lib/agent/system-prompt.ts`, update the function signature and add the knowledge section at the end of the returned string:

Change the function signature from:

```typescript
export function buildSystemPrompt(locale: string): string {
```

to:

```typescript
export function buildSystemPrompt(locale: string, knowledgeContext?: string[]): string {
```

Then, before the final closing backtick of the return statement, add a conditional knowledge section. Find the end of the existing return template literal (the line with just the closing backtick and semicolon) and insert before it:

```typescript
${knowledgeContext && knowledgeContext.length > 0 ? `

## Veterinary Nutrition Knowledge

The following excerpts are from Dr. Judy Morgan, a holistic veterinarian specializing in canine nutrition. Use this knowledge to inform your analysis where relevant. Do not cite or reference the source — just apply the knowledge.

${knowledgeContext.map((chunk, i) => `--- Excerpt ${i + 1} ---\n${chunk}`).join("\n\n")}
` : ""}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agent/system-prompt.ts
git commit -m "feat: add knowledge context injection to system prompt"
```

---

## Task 5: Integrate RAG into Recipe Analysis API Route

**Files:**
- Modify: `src/app/api/recipes/analyze/route.ts`

- [ ] **Step 1: Add import**

At the top of `src/app/api/recipes/analyze/route.ts`, add:

```typescript
import { getRelevantKnowledge } from "@/lib/embeddings";
```

- [ ] **Step 2: Add retrieval step before agent creation**

In the POST handler, after the ingredient list is fetched (after the line that queries `recipe_ingredients`) and before the `createRecipeAgent` call, add the knowledge retrieval:

```typescript
    // Retrieve relevant veterinary nutrition knowledge
    const ingredientNames = ingredients.map((ing: { name: string }) => ing.name);
    let knowledgeContext: string[] = [];
    try {
      knowledgeContext = await getRelevantKnowledge(ingredientNames);
    } catch (err) {
      console.error("RAG retrieval failed, continuing without knowledge context:", err);
    }
```

- [ ] **Step 3: Pass knowledgeContext to createRecipeAgent**

Update the `createRecipeAgent` call to pass `knowledgeContext`. First, update `create-agent.ts` to accept and forward it.

In `src/lib/agent/create-agent.ts`, add `knowledgeContext` to the options interface:

```typescript
interface CreateRecipeAgentOptions {
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
  knowledgeContext?: string[];
}
```

Update the destructuring and `buildSystemPrompt` call:

```typescript
export function createRecipeAgent({
  locale,
  supabaseUrl,
  supabaseKey,
  knowledgeContext,
}: CreateRecipeAgentOptions): Agent {
```

And change the system prompt line from:

```typescript
  const systemPrompt = buildSystemPrompt(locale);
```

to:

```typescript
  const systemPrompt = buildSystemPrompt(locale, knowledgeContext);
```

- [ ] **Step 4: Update the createRecipeAgent call in route.ts**

In `src/app/api/recipes/analyze/route.ts`, update the call from:

```typescript
    const agent = createRecipeAgent({
      locale,
      supabaseUrl,
      supabaseKey,
    });
```

to:

```typescript
    const agent = createRecipeAgent({
      locale,
      supabaseUrl,
      supabaseKey,
      knowledgeContext,
    });
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/analyze/route.ts src/lib/agent/create-agent.ts
git commit -m "feat: integrate RAG retrieval into recipe analysis pipeline"
```

---

## Task 6: Helm Chart — Ollama Deployment

**Files:**
- Create: `refs/gitops/helm/pawbalance/templates/ollama-pvc.yaml`
- Create: `refs/gitops/helm/pawbalance/templates/ollama-deployment.yaml`
- Create: `refs/gitops/helm/pawbalance/templates/ollama-service.yaml`
- Modify: `refs/gitops/helm/pawbalance/values.yaml`
- Modify: `refs/gitops/helm/pawbalance/templates/deployment.yaml`

- [ ] **Step 1: Add Ollama config to values.yaml**

Append to `refs/gitops/helm/pawbalance/values.yaml`:

```yaml

ollama:
  enabled: true
  image: ollama/ollama:latest
  model: nomic-embed-text-v2-moe
  port: 11434
  storage: 2Gi
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

- [ ] **Step 2: Create PVC for model storage**

Create `refs/gitops/helm/pawbalance/templates/ollama-pvc.yaml`:

```yaml
{{- if .Values.ollama.enabled }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ollama-models
  namespace: {{ .Values.namespace }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.ollama.storage }}
{{- end }}
```

- [ ] **Step 3: Create Ollama deployment**

Create `refs/gitops/helm/pawbalance/templates/ollama-deployment.yaml`:

```yaml
{{- if .Values.ollama.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
  namespace: {{ .Values.namespace }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      initContainers:
      - name: pull-model
        image: {{ .Values.ollama.image }}
        command: ["sh", "-c"]
        args:
          - |
            ollama serve &
            sleep 5
            ollama pull {{ .Values.ollama.model }}
            kill %1
        volumeMounts:
        - name: ollama-models
          mountPath: /root/.ollama
      containers:
      - name: ollama
        image: {{ .Values.ollama.image }}
        ports:
        - containerPort: {{ .Values.ollama.port }}
        volumeMounts:
        - name: ollama-models
          mountPath: /root/.ollama
        resources:
          requests:
            memory: {{ .Values.ollama.resources.requests.memory | quote }}
            cpu: {{ .Values.ollama.resources.requests.cpu | quote }}
          limits:
            memory: {{ .Values.ollama.resources.limits.memory | quote }}
            cpu: {{ .Values.ollama.resources.limits.cpu | quote }}
        readinessProbe:
          httpGet:
            path: /api/tags
            port: {{ .Values.ollama.port }}
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /api/tags
            port: {{ .Values.ollama.port }}
          initialDelaySeconds: 15
          periodSeconds: 30
      volumes:
      - name: ollama-models
        persistentVolumeClaim:
          claimName: ollama-models
{{- end }}
```

- [ ] **Step 4: Create Ollama service**

Create `refs/gitops/helm/pawbalance/templates/ollama-service.yaml`:

```yaml
{{- if .Values.ollama.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: ollama
  namespace: {{ .Values.namespace }}
spec:
  type: ClusterIP
  selector:
    app: ollama
  ports:
  - port: {{ .Values.ollama.port }}
    targetPort: {{ .Values.ollama.port }}
{{- end }}
```

- [ ] **Step 5: Add OLLAMA_URL env to PawBalance deployment**

In `refs/gitops/helm/pawbalance/templates/deployment.yaml`, the env vars are rendered from `.Values.env`. Add to the `env` section in `refs/gitops/helm/pawbalance/values.yaml`:

```yaml
  OLLAMA_URL: "http://ollama.pawbalance.svc.cluster.local:11434"
```

This goes inside the existing `env:` block in values.yaml.

- [ ] **Step 6: Commit**

```bash
git add refs/gitops/helm/pawbalance/
git commit -m "feat: add Ollama deployment to Helm chart for RAG embeddings"
```

---

## Task 7: End-to-End Verification

- [ ] **Step 1: Verify video_chunks has data**

```sql
select count(*) from video_chunks;
-- Expected: several thousand rows
```

- [ ] **Step 2: Test the search RPC manually**

First, generate a test embedding locally:

```bash
curl -s http://localhost:11434/api/embed \
  -d '{"model":"nomic-embed-text-v2-moe","input":["chicken liver safety for dogs"]}' \
  | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['embeddings'][0]))" \
  > /tmp/test_embedding.json
```

Then test the RPC in Supabase SQL editor:

```sql
select content, video_title, 1 - (embedding <=> '<paste_vector_here>'::vector) as similarity
from video_chunks
order by embedding <=> '<paste_vector_here>'::vector
limit 3;
```

Expected: relevant chunks about liver / organ meat for dogs.

- [ ] **Step 3: Test the full recipe analysis flow**

Run the server locally:

```bash
BUILD_MODE=server npm run dev
```

Trigger a recipe analysis via the app or curl. Check server logs for:
- No errors from `getRelevantKnowledge`
- The agent receiving knowledge context in its system prompt

- [ ] **Step 4: Verify analysis quality improvement**

Compare a recipe analysis result (e.g. a recipe with turmeric, bone broth, or organ meats) before and after the knowledge base. The agent should now provide more specific, authoritative advice informed by Dr. Judy Morgan's content.

---

## Summary of All Commits

| Task | Commit Message |
|------|---------------|
| 1 | `feat: add video_chunks table and search RPC for RAG` |
| 2 | `feat: add YouTube transcript ingest pipeline for RAG` |
| 3 | `feat: add embeddings utility for RAG retrieval` |
| 4 | `feat: add knowledge context injection to system prompt` |
| 5 | `feat: integrate RAG retrieval into recipe analysis pipeline` |
| 6 | `feat: add Ollama deployment to Helm chart for RAG embeddings` |
