"use client";

import { useRecipeStore } from "@/store/recipe-store";
import { useAuthStore } from "@/store/auth-store";
import { useCallback } from "react";

export type { IngredientProgress } from "@/lib/types";

export function useRecipeAnalysis(recipeId?: string | null) {
  const activeAnalysis = useRecipeStore((s) => s.activeAnalysis);
  const startAnalysis = useRecipeStore((s) => s.startAnalysis);
  const abortAnalysis = useRecipeStore((s) => s.abortAnalysis);
  const { session } = useAuthStore();
  const scopedAnalysis =
    !recipeId || activeAnalysis?.recipeId === recipeId ? activeAnalysis : null;

  const analyze = useCallback(
    (recipeId: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;
      startAnalysis(recipeId, petId, locale, session.access_token);
    },
    [session, startAnalysis],
  );

  return {
    recipeId: scopedAnalysis?.recipeId ?? null,
    status: scopedAnalysis?.status ?? "idle",
    ingredientProgress: scopedAnalysis?.ingredientProgress ?? [],
    result: scopedAnalysis?.result ?? null,
    error: scopedAnalysis?.error ?? null,
    analyze,
    abort: abortAnalysis,
  };
}
