"use client";

import { useRecipeStore } from "@/store/recipe-store";
import { useAuthStore } from "@/store/auth-store";
import { useCallback } from "react";

export type { IngredientProgress } from "@/lib/types";

export function useRecipeAnalysis() {
  const activeAnalysis = useRecipeStore((s) => s.activeAnalysis);
  const startAnalysis = useRecipeStore((s) => s.startAnalysis);
  const abortAnalysis = useRecipeStore((s) => s.abortAnalysis);
  const { session } = useAuthStore();

  const analyze = useCallback(
    (recipeId: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;
      startAnalysis(recipeId, petId, locale, session.access_token);
    },
    [session, startAnalysis],
  );

  return {
    status: activeAnalysis?.status ?? "idle",
    ingredientProgress: activeAnalysis?.ingredientProgress ?? [],
    result: activeAnalysis?.result ?? null,
    error: activeAnalysis?.error ?? null,
    analyze,
    abort: abortAnalysis,
  };
}
