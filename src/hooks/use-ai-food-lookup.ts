"use client";

import { useState, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AIFoodResult } from "@/lib/types";

export type AIFoodStatus = "idle" | "loading" | "done" | "error";

export function useAIFoodLookup() {
  const { session } = useAuthStore();
  const [status, setStatus] = useState<AIFoodStatus>("idle");
  const [result, setResult] = useState<AIFoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(
    async (query: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;

      setStatus("loading");
      setResult(null);
      setError(null);
      setStatusText(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(getApiUrl("/api/foods/ask"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query, petId, locale }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const remainingLines = buffer.split("\n");
              for (const line of remainingLines) {
                if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7);
                } else if (line.startsWith("data: ") && currentEvent) {
                  const data = JSON.parse(line.slice(6));
                  handleEvent(currentEvent, data);
                  currentEvent = "";
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEvent, data);
              currentEvent = "";
            }
          }
        }

        // If we finished the stream without getting a result, mark as error
        setStatus((prev) => (prev === "loading" ? "error" : prev));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Analysis failed",
          );
        }
      }
    },
    [session],
  );

  const handleEvent = (event: string, data: any) => {
    switch (event) {
      case "status":
        setStatusText(data.phase === "looking_up" ? "looking_up" : null);
        break;
      case "tool_start":
        if (data.toolName === "lookup_food") {
          setStatusText("checking_database");
        }
        break;
      case "tool_end":
        setStatusText(null);
        break;
      case "result":
        setStatus("done");
        setResult(data as AIFoodResult);
        break;
      case "error":
        setStatus("error");
        setError(data.message);
        break;
    }
  };

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { status, result, error, statusText, lookup, abort };
}
