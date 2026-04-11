// src/lib/embeddings.ts

import { createClient } from "@supabase/supabase-js";
import http from "node:http";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text-v2-moe";

/**
 * Embed a text string via Ollama API.
 * Uses node:http directly to avoid undici socket reuse issues with Ollama.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const url = new URL(`${OLLAMA_URL}/api/embed`);
  const payload = JSON.stringify({ model: EMBED_MODEL, input: [text] });

  const data = await new Promise<string>((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "Connection": "close",
        },
        timeout: 30000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Ollama embed request timed out"));
    });
    req.write(payload);
    req.end();
  });

  const json = JSON.parse(data);
  return json.embeddings[0];
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
