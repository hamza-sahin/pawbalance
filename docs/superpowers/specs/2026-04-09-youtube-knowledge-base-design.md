# YouTube-to-Knowledge-Base for Recipe Analysis Agent

**Date:** 2026-04-09
**Status:** Approved

## Goal

Enrich the existing recipe analysis agent with veterinary nutrition knowledge extracted from Dr. Judy Morgan's YouTube channel (~500 videos). The agent will silently use this knowledge when analyzing recipes — no citations, no new user-facing features.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  One-time: Python script (runs on dev Mac)              │
│                                                         │
│  YouTube captions ──► chunk ──► embed ──► Supabase      │
│  (youtube-transcript-api)  (nomic-embed   (pgvector)    │
│  (yt-dlp + faster-whisper   -text-v2-moe               │
│   for uncaptioned)          via Ollama)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Per request: API route (K8s)                           │
│                                                         │
│  Recipe ingredients                                     │
│       │                                                 │
│       ▼                                                 │
│  Embed query (Ollama sidecar, nomic-embed-text-v2-moe)  │
│       │                                                 │
│       ▼                                                 │
│  search_video_chunks() ──► top 5 chunks                 │
│       │                                                 │
│       ▼                                                 │
│  Inject into agent system prompt                        │
│       │                                                 │
│       ▼                                                 │
│  Agent runs as normal (lookup_food + get_pet_profile)   │
└─────────────────────────────────────────────────────────┘
```

## Component 1: Transcription Pipeline (standalone Python script)

**Purpose:** Fetch, transcribe, chunk, embed, and upload all Dr. Judy Morgan's YouTube video transcripts.

**Tools:**
- `youtube-transcript-api` — fetch existing YouTube captions (free, instant, covers ~90% of videos)
- `youtube-channel-transcript-api` — enumerate all videos from a channel
- `yt-dlp` — download audio for uncaptioned videos
- `faster-whisper` — local transcription fallback for uncaptioned videos
- `Ollama` with `nomic-embed-text-v2-moe` — local embedding (350 MB model, zero cost)

**Chunking strategy:**
- Sentence-boundary chunking via SpaCy
- ~400 tokens per chunk, ~50 token overlap
- Metadata preserved per chunk: video_id, video_title, chunk_index, timestamp_start, timestamp_end

**Embedding:**
- Model: `nomic-embed-text-v2-moe` via Ollama (`localhost:11434`)
- Output dimension: 768
- Matryoshka support available if dimension reduction needed later

**Output:** ~50K chunks inserted into Supabase `video_chunks` table.

**Run once from Mac.** Requirements: Python 3.11+, Ollama with model pulled, YouTube Data API key (free tier).

## Component 2: Supabase Schema

### New table: `video_chunks`

```sql
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

create index on video_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
```

### New RPC function: `search_video_chunks`

```sql
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
  select id, content, video_title, 1 - (embedding <=> query_embedding) as similarity
  from video_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$ language sql;
```

## Component 3: Server-side Integration

### Changes to existing files:

**`src/app/api/recipes/analyze/route.ts`**
- After fetching recipe ingredients, before invoking the agent:
  1. Build a query string from ingredient names
  2. Call `embedQuery()` to get vector from Ollama sidecar
  3. Call `searchVideoChunks()` to retrieve top 5 relevant chunks from Supabase
  4. Pass chunks to system prompt builder

**`src/lib/agent/system-prompt.ts`**
- Accept optional `knowledgeContext: string[]` parameter
- When provided, append a `## Veterinary Nutrition Knowledge` section to the system prompt containing the retrieved chunks

### New file:

**`src/lib/embeddings.ts`**
- `embedQuery(text: string): Promise<number[]>` — calls Ollama API at `localhost:11434` (sidecar) with `nomic-embed-text-v2-moe`
- `searchVideoChunks(queryEmbedding: number[], matchCount?: number)` — calls Supabase RPC `search_video_chunks`
- `getRelevantKnowledge(ingredients: string[]): Promise<string[]>` — orchestrates embed + search, returns chunk contents

## Component 4: Infrastructure (K8s / GitOps)

### Ollama sidecar in Helm chart

Update `refs/gitops/helm/pawbalance/` to add an Ollama sidecar container to the PawBalance deployment:

- **Image:** `ollama/ollama:latest`
- **Model:** `nomic-embed-text-v2-moe` (preloaded via init container or persistent volume)
- **Resources:** ~350 MB memory for the model, minimal CPU
- **Port:** 11434 (localhost, no external exposure)
- **Access:** PawBalance API route calls `http://localhost:11434` (same pod)

ArgoCD syncs automatically from the gitops repo.

## What's NOT Changing

- Agent framework (`@mariozechner/pi-agent-core`) — untouched
- Existing tools (`lookup_food`, `get_pet_profile`) — untouched
- Analysis output JSON schema — identical
- Client-side code (iOS + web) — zero changes
- Authentication/subscription flow — unchanged
- The agent doesn't know where knowledge came from — just additional system prompt context

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Knowledge source | Dr. Judy Morgan YouTube channel | Holistic vet, ~500 videos on dog nutrition |
| Scope | Recipe analysis agent only | Focused value, no new features |
| Retrieval method | RAG via pgvector | Server-side, pre-fetch before agent runs |
| Embedding model | `nomic-embed-text-v2-moe` | Open source, 350 MB, multilingual, runs in K8s sidecar |
| Vector storage | Supabase pgvector | Already in stack, zero new infra |
| Transcription | `youtube-transcript-api` + `faster-whisper` fallback | Free, covers 100% of videos |
| Pipeline | Standalone Python script, run once | Simple, no ongoing maintenance |
| Citations | Silent — no source attribution in output | Keep output clean |
| Query-time embedding | Ollama sidecar in K8s pod | Same model as corpus, ~50ms per query |
