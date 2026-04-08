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
