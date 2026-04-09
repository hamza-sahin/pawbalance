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
    """Fetch all video IDs and titles from a channel's uploads playlist."""
    videos = []
    # Channel uploads playlist: replace 'UC' prefix with 'UU'
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
        time.sleep(0.5)  # rate limit courtesy
    return videos


def fetch_transcript(video_id: str) -> list[dict] | None:
    """Try to fetch YouTube captions with retry on rate limit."""
    for attempt in range(3):
        try:
            api = YouTubeTranscriptApi()
            transcript = api.fetch(video_id)
            return [{"text": s.text, "start": s.start, "duration": s.duration}
                    for s in transcript.snippets]
        except Exception as e:
            err_name = type(e).__name__
            if "IpBlocked" in err_name or "429" in str(e):
                wait = 30 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s (attempt {attempt+1}/3)...")
                time.sleep(wait)
                continue
            return None
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

    # Build a timestamp lookup: map character offset -> timestamp
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
        time.sleep(1)  # rate limit courtesy between videos

    print()
    print(f"=== Done ===")
    print(f"Total new chunks: {total_chunks}")
    if failed:
        print(f"Failed videos ({len(failed)}): {failed}")


if __name__ == "__main__":
    main()
