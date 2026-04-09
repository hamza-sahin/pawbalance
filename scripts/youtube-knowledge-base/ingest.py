#!/usr/bin/env python3
"""
YouTube-to-Knowledge-Base Ingest Pipeline
Fetches transcripts from a YouTube channel using Chrome cookies + InnerTube API,
chunks them, embeds with Ollama, and uploads to Supabase pgvector.

Prerequisites:
- Be logged into YouTube in Chrome
- Ollama running with nomic-embed-text-v2-moe model
- pip install browser-cookie3 spacy supabase requests python-dotenv
- python -m spacy download en_core_web_sm
"""

import hashlib
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import browser_cookie3
import requests
import spacy
from dotenv import load_dotenv
from supabase import create_client

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


def create_youtube_session():
    """Create a requests session with Chrome YouTube cookies + SAPISIDHASH auth."""
    cj = browser_cookie3.chrome(domain_name=".youtube.com")
    session = requests.Session()
    session.cookies = cj
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    })

    # Find SAPISID for authentication
    sapisid = None
    for c in cj:
        if c.name in ("SAPISID", "__Secure-3PAPISID"):
            sapisid = c.value
            break

    if not sapisid:
        print("ERROR: No SAPISID cookie found. Make sure you're logged into YouTube in Chrome.")
        sys.exit(1)

    return session, sapisid


def get_auth_header(sapisid: str) -> str:
    """Generate SAPISIDHASH authorization header."""
    origin = "https://www.youtube.com"
    timestamp = str(int(time.time()))
    hash_str = hashlib.sha1(f"{timestamp} {sapisid} {origin}".encode()).hexdigest()
    return f"SAPISIDHASH {timestamp}_{hash_str}"


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
    """Fetch all video IDs and titles from a channel's uploads playlist."""
    videos = []
    uploads_playlist = channel_id.replace("UC", "UU", 1)
    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    params = {
        "part": "snippet",
        "playlistId": uploads_playlist,
        "maxResults": 50,
        "key": YOUTUBE_API_KEY,
    }
    while True:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("items", []):
            snippet = item["snippet"]
            video_id = snippet["resourceId"]["videoId"]
            videos.append({
                "video_id": video_id,
                "title": snippet["title"],
            })
        next_page = data.get("nextPageToken")
        if not next_page:
            break
        params["pageToken"] = next_page
        time.sleep(0.5)
    return videos


def fetch_transcript(session, sapisid: str, video_id: str) -> list[dict] | None:
    """Fetch transcript via YouTube InnerTube API with authenticated session."""
    auth_header = get_auth_header(sapisid)

    resp = session.post(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        json={
            "context": {
                "client": {
                    "clientName": "WEB",
                    "clientVersion": "2.20250101.00.00",
                    "hl": "en",
                }
            },
            "videoId": video_id,
        },
        headers={
            "Authorization": auth_header,
            "X-Origin": "https://www.youtube.com",
            "Content-Type": "application/json",
        },
    )

    data = resp.json()
    tracks = (
        data.get("captions", {})
        .get("playerCaptionsTracklistRenderer", {})
        .get("captionTracks", [])
    )

    if not tracks:
        return None

    # Fetch the subtitle content
    sub_url = tracks[0]["baseUrl"] + "&fmt=json3"
    sub_resp = session.get(sub_url)

    if sub_resp.status_code != 200 or len(sub_resp.text) < 10:
        return None

    events = sub_resp.json().get("events", [])
    segments = []
    for event in events:
        segs = event.get("segs", [])
        text = "".join(seg.get("utf8", "") for seg in segs).strip()
        if text:
            segments.append({
                "text": text,
                "start": event.get("tStartMs", 0) / 1000.0,
                "duration": event.get("dDurationMs", 0) / 1000.0,
            })

    return segments if segments else None


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

    # Build a timestamp lookup: map character offset -> timestamp
    char_to_time: dict[int, float] = {}
    offset = 0
    for seg in segments:
        text = seg["text"].strip()
        char_to_time[offset] = seg["start"]
        offset += len(text) + 1

    chunks: list[Chunk] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = estimate_tokens(sentence)
        if current_tokens + sent_tokens > CHUNK_SIZE and current_sentences:
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
    print("=== YouTube Knowledge Base Ingest ===")
    print(f"Channel: {CHANNEL_HANDLE}")
    print(f"Embed model: {EMBED_MODEL}")
    print()

    # Verify Ollama is running
    try:
        requests.get(f"{OLLAMA_URL}/api/tags")
    except requests.ConnectionError:
        print(f"ERROR: Ollama not running at {OLLAMA_URL}")
        print("Start it with: ollama serve")
        sys.exit(1)

    # Create authenticated YouTube session
    print("Loading Chrome YouTube cookies...")
    session, sapisid = create_youtube_session()
    print("Authenticated with YouTube")

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

    new_videos = [v for v in videos if v["video_id"] not in existing_ids]
    print(f"New videos to process: {len(new_videos)}")
    print()

    total_chunks = 0
    failed = []

    for i, video in enumerate(new_videos):
        vid = video["video_id"]
        title = video["title"]
        print(f"[{i+1}/{len(new_videos)}] {title}")

        segments = fetch_transcript(session, sapisid, vid)

        if segments is None:
            print("  SKIPPED: no transcript available")
            failed.append(vid)
            continue

        print(f"  Segments: {len(segments)}")

        chunks = chunk_transcript(vid, title, segments, nlp)
        print(f"  Chunks: {len(chunks)}")

        if not chunks:
            continue

        all_embeddings: list[list[float]] = []
        texts = [c.content for c in chunks]
        for j in range(0, len(texts), BATCH_SIZE):
            batch = texts[j:j + BATCH_SIZE]
            embs = embed_texts(batch)
            all_embeddings.extend(embs)

        upload_chunks(supabase, chunks, all_embeddings)
        total_chunks += len(chunks)
        print(f"  Uploaded {len(chunks)} chunks")
        time.sleep(1)  # rate limit courtesy

    print()
    print("=== Done ===")
    print(f"Total new chunks: {total_chunks}")
    if failed:
        print(f"Failed videos ({len(failed)}): {failed}")


if __name__ == "__main__":
    main()
