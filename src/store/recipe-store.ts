"use client";

import { create } from "zustand";
import { getApiUrl } from "@/lib/api";
import type { RecipeWithIngredients, RecipeAnalysis, AnalysisResult, AnalysisStatus, IngredientProgress } from "@/lib/types";

let analysisAbortController: AbortController | null = null;

interface RecipeState {
  recipes: RecipeWithIngredients[];
  isLoading: boolean;
  setRecipes: (recipes: RecipeWithIngredients[]) => void;
  addRecipe: (recipe: RecipeWithIngredients) => void;
  updateRecipe: (recipe: RecipeWithIngredients) => void;
  removeRecipe: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Latest analysis per recipe
  analyses: Record<string, RecipeAnalysis>;
  setAnalysis: (recipeId: string, analysis: RecipeAnalysis) => void;

  // Cache timestamp
  recipesLoadedAt: number | null;
  setRecipesWithTimestamp: (recipes: RecipeWithIngredients[]) => void;

  // Active analysis (survives navigation)
  activeAnalysis: {
    recipeId: string;
    status: AnalysisStatus | "idle";
    ingredientProgress: IngredientProgress[];
    result: AnalysisResult | null;
    error: string | null;
  } | null;
  setActiveAnalysis: (analysis: RecipeState["activeAnalysis"]) => void;
  updateActiveAnalysis: (patch: Partial<NonNullable<RecipeState["activeAnalysis"]>>) => void;
  clearActiveAnalysis: () => void;

  startAnalysis: (recipeId: string, petId: string | null, locale: string, accessToken: string) => void;
  abortAnalysis: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) =>
    set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (recipe) =>
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    })),
  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),

  analyses: {},
  setAnalysis: (recipeId, analysis) =>
    set((state) => ({
      analyses: { ...state.analyses, [recipeId]: analysis },
    })),

  recipesLoadedAt: null,
  setRecipesWithTimestamp: (recipes) =>
    set({ recipes, recipesLoadedAt: Date.now() }),

  activeAnalysis: null,
  setActiveAnalysis: (activeAnalysis) => set({ activeAnalysis }),
  updateActiveAnalysis: (patch) =>
    set((s) => ({
      activeAnalysis: s.activeAnalysis
        ? { ...s.activeAnalysis, ...patch }
        : null,
    })),
  clearActiveAnalysis: () => set({ activeAnalysis: null }),

  startAnalysis: (recipeId, petId, locale, accessToken) => {
    analysisAbortController?.abort();
    const controller = new AbortController();
    analysisAbortController = controller;

    set({
      activeAnalysis: {
        recipeId,
        status: "pending",
        ingredientProgress: [],
        result: null,
        error: null,
      },
    });

    (async () => {
      try {
        const response = await fetch(getApiUrl("/api/recipes/analyze"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ recipeId, petId, locale }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        const processEvent = (event: string, data: any) => {
          const state = get();
          if (state.activeAnalysis?.recipeId !== recipeId) return;

          switch (event) {
            case "ingredients":
              set({
                activeAnalysis: {
                  ...state.activeAnalysis,
                  ingredientProgress: data.map((i: { id: string; name: string }) => ({
                    id: i.id,
                    name: i.name,
                    status: "pending" as const,
                  })),
                },
              });
              break;

            case "tool_start":
              if (data.toolName === "lookup_food") {
                const query = data.args?.query?.toLowerCase();
                set({
                  activeAnalysis: {
                    ...state.activeAnalysis,
                    ingredientProgress: state.activeAnalysis.ingredientProgress.map((i) =>
                      i.name.toLowerCase().includes(query) ||
                      query?.includes(i.name.toLowerCase())
                        ? { ...i, status: "checking" as const }
                        : i,
                    ),
                  },
                });
              }
              break;

            case "tool_end":
              if (data.toolName === "lookup_food" && !data.isError) {
                const safety = data.result?.details?.safety_level?.toLowerCase();
                set({
                  activeAnalysis: {
                    ...state.activeAnalysis,
                    ingredientProgress: (() => {
                      const prev = state.activeAnalysis.ingredientProgress;
                      const checking = prev.find((i) => i.status === "checking");
                      if (!checking) return prev;
                      return prev.map((i) =>
                        i.id === checking.id
                          ? { ...i, status: "done" as const, safety }
                          : i,
                      );
                    })(),
                  },
                });
              }
              break;

            case "result":
              set({
                activeAnalysis: {
                  ...state.activeAnalysis,
                  status: "completed",
                  result: data,
                },
              });
              state.setAnalysis(recipeId, {
                id: "",
                recipe_id: recipeId,
                pet_id: petId,
                status: "completed",
                result: data,
                model_used: null,
                created_at: new Date().toISOString(),
              });
              break;

            case "error":
              set({
                activeAnalysis: {
                  ...state.activeAnalysis,
                  status: "failed",
                  error: data.message,
                },
              });
              break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const remainingLines = buffer.split("\n");
              for (const line of remainingLines) {
                if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7);
                } else if (line.startsWith("data: ") && currentEvent) {
                  processEvent(currentEvent, JSON.parse(line.slice(6)));
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
              processEvent(currentEvent, JSON.parse(line.slice(6)));
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const state = get();
          if (state.activeAnalysis?.recipeId === recipeId) {
            set({
              activeAnalysis: {
                ...state.activeAnalysis,
                status: "failed",
                error: err instanceof Error ? err.message : "Analysis failed",
              },
            });
          }
        }
      }
    })();
  },

  abortAnalysis: () => {
    analysisAbortController?.abort();
    analysisAbortController = null;
    set({ activeAnalysis: null });
  },
}));
