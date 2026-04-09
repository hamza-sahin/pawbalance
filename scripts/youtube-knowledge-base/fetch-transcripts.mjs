#!/usr/bin/env node
/**
 * Fetch all transcripts from a YouTube channel and save as JSON.
 * Uses youtube-transcript-api (Node.js) which proxies through youtube-transcript.io
 * to avoid YouTube IP bans.
 *
 * Usage: node fetch-transcripts.mjs
 * Output: transcripts/ directory with one JSON file per video
 */

import TranscriptClient from "youtube-transcript-api";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = process.env.CHANNEL_HANDLE || "@DrJudyMorgan";
const OUTPUT_DIR = "./transcripts";
const BATCH_SIZE = 5; // videos per bulk request

if (!YOUTUBE_API_KEY) {
  console.error("ERROR: YOUTUBE_API_KEY environment variable required");
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

async function getChannelId(handle) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&key=${YOUTUBE_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.items?.length) throw new Error(`Channel not found: ${handle}`);
  return data.items[0].snippet.channelId;
}

async function getAllVideoIds(channelId) {
  const uploadsPlaylist = channelId.replace("UC", "UU");
  const videos = [];
  let pageToken = "";

  while (true) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=50&key=${YOUTUBE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const resp = await fetch(url);
    const data = await resp.json();

    for (const item of data.items || []) {
      videos.push({
        video_id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
    await new Promise((r) => setTimeout(r, 300));
  }

  return videos;
}

async function main() {
  console.log(`=== Fetch Transcripts ===`);
  console.log(`Channel: ${CHANNEL_HANDLE}`);
  console.log();

  // Get all videos
  console.log("Fetching video list...");
  const channelId = await getChannelId(CHANNEL_HANDLE);
  const videos = await getAllVideoIds(channelId);
  console.log(`Found ${videos.length} videos`);

  // Filter already-fetched
  const newVideos = videos.filter(
    (v) => !existsSync(`${OUTPUT_DIR}/${v.video_id}.json`)
  );
  console.log(`New videos to fetch: ${newVideos.length}`);
  console.log();

  // Init transcript client
  const client = new TranscriptClient();
  await client.ready;

  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < newVideos.length; i += BATCH_SIZE) {
    const batch = newVideos.slice(i, i + BATCH_SIZE);
    console.log(
      `[${i + 1}-${Math.min(i + BATCH_SIZE, newVideos.length)}/${newVideos.length}] Fetching batch...`
    );

    for (const video of batch) {
      try {
        const result = await client.getTranscript(video.video_id);

        // Save to file
        writeFileSync(
          `${OUTPUT_DIR}/${video.video_id}.json`,
          JSON.stringify(
            {
              video_id: video.video_id,
              title: result.title || video.title,
              tracks: result.tracks || [],
            },
            null,
            2
          )
        );

        success++;
        console.log(`  OK: ${video.title}`);
      } catch (err) {
        failed++;
        console.log(`  FAIL: ${video.title} — ${err.message}`);
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < newVideos.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log();
  console.log(`=== Done ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
