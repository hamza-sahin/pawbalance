"use client";

import { useState, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useRecipeStore } from "@/store/recipe-store";
import type { AnalysisResult, AnalysisStatus } from "@/lib/types";

export interface IngredientProgress {
  id: string;
  name: string;
  status: "pending" | "checking" | "done";
  safety?: string;
}

export function useRecipeAnalysis() {
  const { session } = useAuthStore();
  const { setAnalysis } = useRecipeStore();
  const [status, setStatus] = useState<AnalysisStatus | "idle">("idle");
  const [ingredientProgress, setIngredientProgress] = useState<
    IngredientProgress[]
  >([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (recipeId: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;

      // Reset state
      setStatus("pending");
      setResult(null);
      setError(null);
      setIngredientProgress([]);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(getApiUrl("/api/recipes/analyze"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ recipeId, petId, locale }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(currentEvent, data, recipeId);
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStatus("failed");
          setError(
            err instanceof Error ? err.message : "Analysis failed",
          );
        }
      }
    },
    [session],
  );

  const handleSSEEvent = (event: string, data: any, recipeId: string) => {
    switch (event) {
      case "ingredients":
        setIngredientProgress(
          data.map((i: { id: string; name: string }) => ({
            id: i.id,
            name: i.name,
            status: "pending" as const,
          })),
        );
        break;

      case "tool_start":
        if (data.toolName === "lookup_food") {
          const query = data.args?.query?.toLowerCase();
          setIngredientProgress((prev) =>
            prev.map((i) =>
              i.name.toLowerCase().includes(query) ||
              query?.includes(i.name.toLowerCase())
                ? { ...i, status: "checking" as const }
                : i,
            ),
          );
        }
        break;

      case "tool_end":
        if (data.toolName === "lookup_food" && !data.isError) {
          const details = data.result?.details;
          const safety = details?.safety_level?.toLowerCase();
          // Mark the ingredient that was just looked up as done
          setIngredientProgress((prev) => {
            const checking = prev.find((i) => i.status === "checking");
            if (!checking) return prev;
            return prev.map((i) =>
              i.id === checking.id
                ? { ...i, status: "done" as const, safety }
                : i,
            );
          });
        }
        break;

      case "result":
        setStatus("completed");
        setResult(data);
        setAnalysis(recipeId, {
          id: "",
          recipe_id: recipeId,
          pet_id: null,
          status: "completed",
          result: data,
          model_used: null,
          created_at: new Date().toISOString(),
        });
        break;

      case "error":
        setStatus("failed");
        setError(data.message);
        break;
    }
  };

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return {
    status,
    ingredientProgress,
    result,
    error,
    analyze,
    abort,
  };
}
