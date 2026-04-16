# UX State Persistence & Analysis Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate state loss on navigation, skeleton flash on tab switch, and replace static analysis progress with animated UI.

**Architecture:** Extend existing Zustand stores with cache-first rendering pattern. Move SSE stream management from component-local hooks into stores so streams survive navigation. New animated analysis progress component with determinate progress bar, ingredient chips, floating paws, rotating tips, and checkmark celebration.

**Tech Stack:** Next.js 15, Zustand, Tailwind CSS 4, next-intl, TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/store/recipe-store.ts` | Existing — add `activeAnalysis` state, SSE stream actions, `recipesLoadedAt` |
| `src/store/food-store.ts` | **New** — categories, foods by category, food details, search cache, AI lookup state |
| `src/hooks/use-recipe-analysis.ts` | Thin wrapper over `recipe-store.activeAnalysis` |
| `src/hooks/use-food-search.ts` | Refactor all hooks to read from `food-store` with cache-first |
| `src/hooks/use-ai-food-lookup.ts` | Thin wrapper over `food-store.aiLookup` |
| `src/hooks/use-recipes.ts` | Cache-first: skip skeleton when store has data |
| `src/components/recipe/analysis-progress.tsx` | Full rewrite — progress bar, chips, tips, phases |
| `src/components/recipe/scattered-paws.tsx` | **New** — 6 floating paw SVGs |
| `src/components/recipe/checkmark-celebration.tsx` | **New** — SVG checkmark draw + ring burst |
| `src/lib/constants.ts` | Add `NUTRITION_TIPS` (100 i18n keys) |
| `src/messages/en.json` | Add 100 tip texts + `analysisComplete` key |
| `src/messages/tr.json` | Add 100 tip texts + `analysisComplete` key |
| `src/app/(app)/recipes/analysis/page.tsx` | Use store-based analysis, add animation phases |
| `src/app/(app)/recipes/page.tsx` | Cache-first rendering |
| `src/app/(app)/search/page.tsx` | Cache-first categories + preserve search |
| `src/app/(app)/search/category/page.tsx` | Cache-first foods by category |
| `src/app/(app)/search/food/page.tsx` | Cache-first food detail + persistent AI lookup |

---

### Task 1: Create Food Store

**Files:**
- Create: `src/store/food-store.ts`

- [ ] **Step 1: Create food store with all state and actions**

```typescript
// src/store/food-store.ts
"use client";

import { create } from "zustand";
import type { Food, FoodCategory, AIFoodResult } from "@/lib/types";

export type AIFoodStatus = "idle" | "loading" | "done" | "error";

interface FoodState {
  // Categories
  categories: FoodCategory[];
  categoriesLoadedAt: number | null;
  setCategories: (cats: FoodCategory[]) => void;

  // Foods by category (keyed by category_en name)
  foodsByCategory: Record<string, { foods: Food[]; loadedAt: number }>;
  setFoodsByCategory: (category: string, foods: Food[]) => void;

  // Food details (keyed by food ID)
  foodDetails: Record<string, { food: Food; loadedAt: number }>;
  setFoodDetail: (id: string, food: Food) => void;

  // Search cache (preserve last search for back-navigation)
  lastSearch: { query: string; results: Food[] } | null;
  setLastSearch: (query: string, results: Food[]) => void;
  clearLastSearch: () => void;

  // AI food lookup (survives navigation)
  aiLookup: {
    query: string;
    petId: string | null;
    status: AIFoodStatus;
    statusText: string | null;
    result: AIFoodResult | null;
    error: string | null;
  } | null;
  setAILookup: (lookup: FoodState["aiLookup"]) => void;
  updateAILookup: (patch: Partial<NonNullable<FoodState["aiLookup"]>>) => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  categories: [],
  categoriesLoadedAt: null,
  setCategories: (categories) =>
    set({ categories, categoriesLoadedAt: Date.now() }),

  foodsByCategory: {},
  setFoodsByCategory: (category, foods) =>
    set((s) => ({
      foodsByCategory: {
        ...s.foodsByCategory,
        [category]: { foods, loadedAt: Date.now() },
      },
    })),

  foodDetails: {},
  setFoodDetail: (id, food) =>
    set((s) => ({
      foodDetails: {
        ...s.foodDetails,
        [id]: { food, loadedAt: Date.now() },
      },
    })),

  lastSearch: null,
  setLastSearch: (query, results) => set({ lastSearch: { query, results } }),
  clearLastSearch: () => set({ lastSearch: null }),

  aiLookup: null,
  setAILookup: (aiLookup) => set({ aiLookup }),
  updateAILookup: (patch) =>
    set((s) => ({
      aiLookup: s.aiLookup ? { ...s.aiLookup, ...patch } : null,
    })),
}));
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `food-store.ts`

- [ ] **Step 3: Commit**

```bash
git add src/store/food-store.ts
git commit -m "feat: add food-store for cache-first data persistence"
```

---

### Task 2: Add Active Analysis + Cache Timestamps to Recipe Store

**Files:**
- Modify: `src/store/recipe-store.ts`

- [ ] **Step 1: Add activeAnalysis state and recipesLoadedAt to recipe store**

Add these imports at the top of `src/store/recipe-store.ts`:

```typescript
import type { AnalysisResult, AnalysisStatus } from "@/lib/types";
import type { IngredientProgress } from "@/hooks/use-recipe-analysis";
```

Note: `IngredientProgress` is currently defined in `use-recipe-analysis.ts`. We need to move it to `types.ts` first to avoid circular deps. Add this to `src/lib/types.ts` after the `RecipeAnalysis` interface:

```typescript
export interface IngredientProgress {
  id: string;
  name: string;
  status: "pending" | "checking" | "done";
  safety?: string;
}
```

Then update the import in `src/store/recipe-store.ts` to:

```typescript
import type { RecipeWithIngredients, RecipeAnalysis, AnalysisResult, AnalysisStatus, IngredientProgress } from "@/lib/types";
```

Add to `RecipeState` interface (after `setAnalysis`):

```typescript
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
```

Add to store implementation (after `setAnalysis`):

```typescript
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
```

- [ ] **Step 2: Update IngredientProgress import in use-recipe-analysis.ts**

In `src/hooks/use-recipe-analysis.ts`, remove the `IngredientProgress` interface definition (lines 9-14) and replace the export with a re-export:

```typescript
export type { IngredientProgress } from "@/lib/types";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/store/recipe-store.ts src/hooks/use-recipe-analysis.ts
git commit -m "feat: add activeAnalysis and cache timestamps to recipe store"
```

---

### Task 3: Move Analysis SSE Stream to Store Level

**Files:**
- Modify: `src/hooks/use-recipe-analysis.ts`
- Modify: `src/store/recipe-store.ts`

- [ ] **Step 1: Add SSE stream management to recipe-store.ts**

Add a module-level abort controller ref at the top of `src/store/recipe-store.ts` (after imports, before interface):

```typescript
import { getApiUrl } from "@/lib/api";

// Module-level ref — survives component unmounts
let analysisAbortController: AbortController | null = null;
```

Add two new actions to the `RecipeState` interface:

```typescript
  startAnalysis: (recipeId: string, petId: string | null, locale: string, accessToken: string) => void;
  abortAnalysis: () => void;
```

Add implementation inside `create<RecipeState>((set, get) => ({` — note: change `(set)` to `(set, get)`:

```typescript
  startAnalysis: (recipeId, petId, locale, accessToken) => {
    // Abort any existing analysis
    analysisAbortController?.abort();
    const controller = new AbortController();
    analysisAbortController = controller;

    // Initialize active analysis
    set({
      activeAnalysis: {
        recipeId,
        status: "pending",
        ingredientProgress: [],
        result: null,
        error: null,
      },
    });

    // Start SSE fetch (fire and forget — store manages state)
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
              // Also save to analyses map
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
```

- [ ] **Step 2: Rewrite use-recipe-analysis.ts as thin wrapper**

Replace entire content of `src/hooks/use-recipe-analysis.ts`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Verify app builds**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/store/recipe-store.ts src/hooks/use-recipe-analysis.ts
git commit -m "feat: move analysis SSE stream to store level, survives navigation"
```

---

### Task 4: Move AI Food Lookup to Store Level

**Files:**
- Modify: `src/hooks/use-ai-food-lookup.ts`
- Modify: `src/store/food-store.ts`

- [ ] **Step 1: Add AI lookup SSE management to food-store.ts**

Add at top of `src/store/food-store.ts` (after imports):

```typescript
import { getApiUrl } from "@/lib/api";

let aiLookupAbortController: AbortController | null = null;
```

Add to `FoodState` interface:

```typescript
  startAILookup: (query: string, petId: string | null, locale: string, accessToken: string) => void;
  abortAILookup: () => void;
```

Change `create<FoodState>((set)` to `create<FoodState>((set, get)` and add implementation:

```typescript
  startAILookup: (query, petId, locale, accessToken) => {
    aiLookupAbortController?.abort();
    const controller = new AbortController();
    aiLookupAbortController = controller;

    set({
      aiLookup: {
        query,
        petId,
        status: "loading",
        statusText: null,
        result: null,
        error: null,
      },
    });

    (async () => {
      try {
        const response = await fetch(getApiUrl("/api/foods/ask"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query, petId, locale }),
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
          if (state.aiLookup?.query !== query) return;

          switch (event) {
            case "status":
              state.updateAILookup({
                statusText: data.phase === "looking_up" ? "looking_up" : null,
              });
              break;
            case "tool_start":
              if (data.toolName === "lookup_food") {
                state.updateAILookup({ statusText: "checking_database" });
              }
              break;
            case "tool_end":
              state.updateAILookup({ statusText: null });
              break;
            case "result":
              state.updateAILookup({
                status: "done",
                result: data as AIFoodResult,
              });
              break;
            case "error":
              state.updateAILookup({
                status: "error",
                error: data.message,
              });
              break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const lines = buffer.split("\n");
              for (const line of lines) {
                if (line.startsWith("event: ")) currentEvent = line.slice(7);
                else if (line.startsWith("data: ") && currentEvent) {
                  processEvent(currentEvent, JSON.parse(line.slice(6)));
                  currentEvent = "";
                }
              }
            }
            // If still loading after stream end, mark error
            const s = get();
            if (s.aiLookup?.status === "loading") {
              s.updateAILookup({ status: "error" });
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) currentEvent = line.slice(7);
            else if (line.startsWith("data: ") && currentEvent) {
              processEvent(currentEvent, JSON.parse(line.slice(6)));
              currentEvent = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const s = get();
          if (s.aiLookup?.query === query) {
            s.updateAILookup({
              status: "error",
              error: err instanceof Error ? err.message : "Analysis failed",
            });
          }
        }
      }
    })();
  },

  abortAILookup: () => {
    aiLookupAbortController?.abort();
    aiLookupAbortController = null;
    set({ aiLookup: null });
  },
```

- [ ] **Step 2: Rewrite use-ai-food-lookup.ts as thin wrapper**

Replace entire content of `src/hooks/use-ai-food-lookup.ts`:

```typescript
"use client";

import { useCallback } from "react";
import { useFoodStore } from "@/store/food-store";
import { useAuthStore } from "@/store/auth-store";

export type { AIFoodStatus } from "@/store/food-store";

export function useAIFoodLookup() {
  const aiLookup = useFoodStore((s) => s.aiLookup);
  const startAILookup = useFoodStore((s) => s.startAILookup);
  const abortAILookup = useFoodStore((s) => s.abortAILookup);
  const { session } = useAuthStore();

  const lookup = useCallback(
    (query: string, petId: string | null, locale: string) => {
      if (!session?.access_token) return;
      startAILookup(query, petId, locale, session.access_token);
    },
    [session, startAILookup],
  );

  return {
    status: aiLookup?.status ?? "idle",
    result: aiLookup?.result ?? null,
    error: aiLookup?.error ?? null,
    statusText: aiLookup?.statusText ?? null,
    lookup,
    abort: abortAILookup,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/store/food-store.ts src/hooks/use-ai-food-lookup.ts
git commit -m "feat: move AI food lookup SSE to food-store, survives navigation"
```

---

### Task 5: Cache-First Food Hooks

**Files:**
- Modify: `src/hooks/use-food-search.ts`

- [ ] **Step 1: Rewrite all hooks in use-food-search.ts to use food-store**

Replace entire content of `src/hooks/use-food-search.ts`:

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useFoodStore } from "@/store/food-store";
import type { Food, FoodCategory } from "@/lib/types";

const CATEGORY_STALE_MS = 5 * 60 * 1000; // 5 minutes
const FOODS_STALE_MS = 5 * 60 * 1000;
const DETAIL_STALE_MS = 10 * 60 * 1000;

export function useFoodSearch() {
  const { lastSearch, setLastSearch, clearLastSearch } = useFoodStore();
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      clearLastSearch();
      return;
    }
    setIsSearching(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("search_foods", {
      search_query: query,
    });
    if (error) throw error;
    const results = (data as Food[]) ?? [];
    setLastSearch(query, results);
    setIsSearching(false);
  }, [setLastSearch, clearLastSearch]);

  const clearSearch = useCallback(() => clearLastSearch(), [clearLastSearch]);

  return {
    results: lastSearch?.results ?? [],
    isSearching,
    search,
    clearSearch,
    lastQuery: lastSearch?.query ?? "",
  };
}

export function useSimilarFoods() {
  const [similar, setSimilar] = useState<Food[]>([]);

  const fetchSimilar = useCallback(async (query: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("get_similar_foods", {
      search_query: query,
      limit_count: 5,
    });
    if (error) throw error;
    setSimilar((data as Food[]) ?? []);
  }, []);

  return { similar, fetchSimilar };
}

export function useCategories() {
  const { categories, categoriesLoadedAt, setCategories } = useFoodStore();

  const isStale =
    !categoriesLoadedAt || Date.now() - categoriesLoadedAt > CATEGORY_STALE_MS;
  const isLoading = categories.length === 0;

  const fetchCategories = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("food_categories")
      .select("id, name_en, name_tr, food_count");
    if (error) throw error;
    setCategories((data as FoodCategory[]) ?? []);
  }, [setCategories]);

  useEffect(() => {
    if (isStale) fetchCategories();
  }, [isStale, fetchCategories]);

  return { categories, isLoading, fetchCategories };
}

export function useFoodsByCategory() {
  const { foodsByCategory, setFoodsByCategory } = useFoodStore();
  const [activeCategory, setActiveCategory] = useState<string>("");

  const cached = activeCategory ? foodsByCategory[activeCategory] : null;
  const isStale = !cached || Date.now() - cached.loadedAt > FOODS_STALE_MS;
  const isLoading = activeCategory !== "" && !cached;

  const fetchByCategory = useCallback(
    async (categoryEn: string) => {
      setActiveCategory(categoryEn);
      const existing = useFoodStore.getState().foodsByCategory[categoryEn];
      if (existing && Date.now() - existing.loadedAt < FOODS_STALE_MS) return;

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("category_en", categoryEn)
        .order("name_en");
      if (error) throw error;
      setFoodsByCategory(categoryEn, (data as Food[]) ?? []);
    },
    [setFoodsByCategory],
  );

  return {
    foods: cached?.foods ?? [],
    isLoading,
    fetchByCategory,
  };
}

export function useFoodDetail() {
  const { foodDetails, setFoodDetail } = useFoodStore();
  const [activeId, setActiveId] = useState<string>("");

  const cached = activeId ? foodDetails[activeId] : null;
  const isLoading = activeId !== "" && !cached;

  const fetchFood = useCallback(
    async (id: string) => {
      setActiveId(id);
      const existing = useFoodStore.getState().foodDetails[id];
      if (existing && Date.now() - existing.loadedAt < DETAIL_STALE_MS) return;

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setFoodDetail(id, data as Food);
    },
    [setFoodDetail],
  );

  return {
    food: cached?.food ?? null,
    isLoading,
    fetchFood,
  };
}

export function useFoodRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = useCallback(async (foodName: string) => {
    setIsSubmitting(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("food_requests")
      .insert({ food_name: foodName });
    setIsSubmitting(false);
    if (error) throw error;
  }, []);

  return { isSubmitting, submitRequest };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-food-search.ts
git commit -m "feat: cache-first food hooks backed by food-store"
```

---

### Task 6: Cache-First Recipes Hook

**Files:**
- Modify: `src/hooks/use-recipes.ts`

- [ ] **Step 1: Update fetchRecipes to use cache-first pattern**

In `src/hooks/use-recipes.ts`, change the destructuring from `useRecipeStore` (around line 19) to also get `recipesLoadedAt` and `setRecipesWithTimestamp`:

```typescript
  const {
    recipes,
    isLoading,
    setRecipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    setLoading,
    analyses,
    setAnalysis,
    recipesLoadedAt,
    setRecipesWithTimestamp,
  } = useRecipeStore();
```

Replace the `fetchRecipes` callback with cache-first version:

```typescript
  const fetchRecipes = useCallback(async () => {
    if (!user) return;

    // Only show loading skeleton on first load (no cached data)
    const hasCache = useRecipeStore.getState().recipes.length > 0;
    if (!hasCache) setLoading(true);

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecipesWithTimestamp(data as RecipeWithIngredients[]);

      // Fetch latest analysis per recipe
      const recipeIds = (data ?? []).map((r: any) => r.id);
      if (recipeIds.length > 0) {
        const { data: analysesData } = await supabase
          .from("recipe_analyses")
          .select("*")
          .in("recipe_id", recipeIds)
          .order("created_at", { ascending: false });
        if (analysesData) {
          const latestByRecipe: Record<string, RecipeAnalysis> = {};
          for (const a of analysesData as RecipeAnalysis[]) {
            if (!latestByRecipe[a.recipe_id]) {
              latestByRecipe[a.recipe_id] = a;
            }
          }
          for (const [recipeId, analysis] of Object.entries(latestByRecipe)) {
            setAnalysis(recipeId, analysis);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, setRecipesWithTimestamp, setLoading, setAnalysis]);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-recipes.ts
git commit -m "feat: cache-first recipes hook, skip skeleton when store has data"
```

---

### Task 7: Update Search Page to Preserve Query

**Files:**
- Modify: `src/app/(app)/search/page.tsx`

- [ ] **Step 1: Use lastQuery from useFoodSearch to restore search state**

In `src/app/(app)/search/page.tsx`, update the `useFoodSearch` usage and `query` state initialization.

Replace:

```typescript
  const { results, isSearching, search, clearSearch } = useFoodSearch();
```

With:

```typescript
  const { results, isSearching, search, clearSearch, lastQuery } = useFoodSearch();
```

Replace:

```typescript
  const [query, setQuery] = useState("");
```

With:

```typescript
  const [query, setQuery] = useState(lastQuery);
```

Remove the `fetchCategories()` useEffect (lines 27-29) — `useCategories` now auto-fetches internally when stale.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/page.tsx
git commit -m "feat: preserve search query across tab switches"
```

---

### Task 8: Update Food Detail Page for Cache-First + Persistent AI Lookup

**Files:**
- Modify: `src/app/(app)/search/food/page.tsx`

- [ ] **Step 1: Update food detail page to handle persistent AI lookup**

In `src/app/(app)/search/food/page.tsx`, the AI lookup hook now returns persisted state. Update the `useEffect` (around line 135) to not re-trigger if we already have a matching result:

Replace the fetch useEffect:

```typescript
  // Fetch on mount
  useEffect(() => {
    if (isAI && aiQuery) {
      lookup(aiQuery, aiPetId, locale);
    } else if (id) {
      fetchFood(id);
    }
    return () => {
      if (isAI) abort();
    };
  }, [isAI, id, aiQuery, aiPetId, locale, fetchFood, lookup, abort]);
```

With:

```typescript
  // Fetch on mount — skip if already loaded from store
  useEffect(() => {
    if (isAI && aiQuery) {
      // Only start new lookup if query changed or no result
      if (aiStatus === "idle" || (aiResult && aiQuery !== aiResult.name)) {
        lookup(aiQuery, aiPetId, locale);
      }
    } else if (id) {
      fetchFood(id);
    }
    // Don't abort on unmount — AI lookup survives navigation
  }, [isAI, id, aiQuery, aiPetId, locale, fetchFood, lookup, aiStatus, aiResult]);
```

Remove the `return () => { if (isAI) abort(); }` cleanup — we want the lookup to persist.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/food/page.tsx
git commit -m "feat: cache-first food detail + persistent AI lookup"
```

---

### Task 9: Add Nutrition Tips to Constants and i18n

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add NUTRITION_TIPS array to constants.ts**

Add at the end of `src/lib/constants.ts`:

```typescript
// ============================================================
// Nutrition Tips (shown during analysis progress)
// ============================================================

export const NUTRITION_TIPS: readonly string[] = Array.from(
  { length: 100 },
  (_, i) => `tip_${i}`,
);
```

- [ ] **Step 2: Add English tips to en.json**

Add a `"tips"` section to `src/messages/en.json` with 100 tips. Read the current file first to determine insertion point (add before the closing `}`).

The tips should cover these categories (~20 each):

**Safe foods (0-19):**
```json
"tip_0": "Blueberries are packed with antioxidants and make a great low-calorie treat for dogs.",
"tip_1": "Cooked chicken breast is one of the safest and most digestible proteins for dogs.",
"tip_2": "Carrots are great for dental health — the crunch helps clean teeth naturally.",
"tip_3": "Watermelon (seedless, no rind) is a hydrating summer treat rich in vitamins A and C.",
"tip_4": "Plain cooked pumpkin is excellent for digestive health and can help with both diarrhea and constipation.",
"tip_5": "Green beans are a low-calorie snack packed with iron, calcium, and vitamins.",
"tip_6": "Cooked sweet potatoes are rich in dietary fiber, vitamin B6, and beta-carotene.",
"tip_7": "Plain cooked rice is gentle on the stomach and great for dogs with digestive issues.",
"tip_8": "Bananas in moderation are a good source of potassium, vitamins, and fiber.",
"tip_9": "Cooked eggs are an excellent source of protein, riboflavin, and selenium for dogs.",
"tip_10": "Apples (without seeds or core) provide fiber and vitamins A and C.",
"tip_11": "Salmon provides omega-3 fatty acids that support coat and skin health.",
"tip_12": "Cucumbers are a low-calorie, hydrating snack perfect for overweight dogs.",
"tip_13": "Peas are a good source of vitamins A, B, and K, plus they contain fiber and protein.",
"tip_14": "Cooked oatmeal is a great source of soluble fiber, especially for senior dogs.",
"tip_15": "Plain yogurt with live cultures can support your dog's digestive health.",
"tip_16": "Broccoli florets in small quantities provide vitamin C and fiber.",
"tip_17": "Coconut oil in small amounts can help improve skin and coat condition.",
"tip_18": "Pears (without seeds) are a good source of copper, vitamins C and K, and fiber.",
"tip_19": "Cranberries are safe for dogs and may support urinary tract health."
```

**Toxic warnings (20-39):**
```json
"tip_20": "Grapes and raisins can cause kidney failure in dogs — even small amounts are dangerous.",
"tip_21": "Chocolate contains theobromine, which dogs metabolize much more slowly than humans.",
"tip_22": "Xylitol (found in sugar-free gum and candy) is extremely toxic to dogs, even in tiny amounts.",
"tip_23": "Onions and garlic contain compounds that can damage a dog's red blood cells.",
"tip_24": "Macadamia nuts can cause weakness, vomiting, and tremors in dogs.",
"tip_25": "Avocado contains persin, which can cause vomiting and diarrhea in dogs.",
"tip_26": "Alcohol is extremely dangerous for dogs — even small amounts can cause serious harm.",
"tip_27": "Caffeine from coffee, tea, or energy drinks can be toxic to dogs.",
"tip_28": "Raw yeast dough can expand in a dog's stomach, causing pain and potentially dangerous bloating.",
"tip_29": "Cherry, peach, and plum pits contain cyanide and pose a choking hazard.",
"tip_30": "Nutmeg contains myristicin, which can cause hallucinations and seizures in dogs.",
"tip_31": "Raw potatoes and potato plants contain solanine, which is toxic to dogs.",
"tip_32": "Rhubarb leaves contain oxalic acid, which can cause kidney problems in dogs.",
"tip_33": "Star fruit can cause kidney failure in dogs, similar to grapes.",
"tip_34": "Hops (used in beer brewing) can cause malignant hyperthermia in dogs.",
"tip_35": "Tomato plants (stems and leaves) contain tomatine, which is toxic to dogs.",
"tip_36": "Wild mushrooms can be extremely toxic — if your dog eats one outdoors, contact your vet immediately.",
"tip_37": "Cooked bones can splinter and cause internal injuries — always use raw or synthetic bones.",
"tip_38": "Persimmon seeds can cause intestinal blockages in dogs.",
"tip_39": "Excessive salt intake can lead to sodium poisoning in dogs — avoid salty snacks."
```

**Preparation tips (40-59):**
```json
"tip_40": "Always cook chicken thoroughly before feeding — raw chicken can carry salmonella.",
"tip_41": "Remove all seeds and pits from fruits before giving them to your dog.",
"tip_42": "Steam vegetables lightly to make them easier to digest while preserving nutrients.",
"tip_43": "Never season your dog's food with salt, garlic powder, or onion powder.",
"tip_44": "Cut food into bite-sized pieces appropriate for your dog's size to prevent choking.",
"tip_45": "Cook fish thoroughly and remove all bones before serving to your dog.",
"tip_46": "Wash all fruits and vegetables to remove pesticides before feeding.",
"tip_47": "Peel citrus fruits completely — the oils in citrus skin can irritate dogs.",
"tip_48": "Mash or puree hard vegetables for small dogs or puppies.",
"tip_49": "Let cooked food cool to room temperature before serving to avoid mouth burns.",
"tip_50": "Remove the skin from chicken to reduce fat content, especially for overweight dogs.",
"tip_51": "Boiling is the healthiest cooking method for dog food — no added oils needed.",
"tip_52": "Freeze small portions of plain yogurt or pumpkin puree for a cooling summer treat.",
"tip_53": "Mix new foods gradually with existing diet — sudden changes can upset your dog's stomach.",
"tip_54": "Dehydrated sweet potato slices make excellent natural chew treats.",
"tip_55": "Bone broth (without onions or garlic) is a nutritious food topper for dogs.",
"tip_56": "Grind flaxseeds before adding to food — whole seeds pass through undigested.",
"tip_57": "Avoid cooking with butter or oil when preparing food for your dog.",
"tip_58": "Soak dry kibble in warm water or broth to make it easier for senior dogs to eat.",
"tip_59": "Store homemade dog food in the fridge for up to 3 days, or freeze for up to 3 months."
```

**Nutrition facts (60-79):**
```json
"tip_60": "Dogs need about 1-2 grams of protein per kilogram of body weight daily.",
"tip_61": "A healthy dog diet should be roughly 50% protein, 25% vegetables, and 25% grains.",
"tip_62": "Dogs are omnivores, not strict carnivores — they can digest plant-based foods too.",
"tip_63": "Puppies need about twice the calories per kilogram of body weight compared to adult dogs.",
"tip_64": "Senior dogs typically need 20% fewer calories than younger adults.",
"tip_65": "Fiber helps regulate digestion — pumpkin and sweet potato are great natural sources.",
"tip_66": "Omega-3 fatty acids from fish can help reduce inflammation and joint pain.",
"tip_67": "Calcium is essential for strong bones — especially important for growing puppies.",
"tip_68": "Iron-rich foods like liver support healthy red blood cell production.",
"tip_69": "Vitamin A from carrots and sweet potatoes supports eye health and immune function.",
"tip_70": "B vitamins help convert food into energy — found in eggs, meat, and whole grains.",
"tip_71": "Zinc supports skin health and wound healing — found in meat and pumpkin seeds.",
"tip_72": "Antioxidants in berries can help slow cognitive decline in senior dogs.",
"tip_73": "Dogs produce their own vitamin C, but extra from foods can still support immunity.",
"tip_74": "Taurine is an essential amino acid for dogs — found naturally in meat and fish.",
"tip_75": "Probiotics from yogurt and kefir support gut health and nutrient absorption.",
"tip_76": "Water makes up about 60-70% of an adult dog's body weight — hydration is crucial.",
"tip_77": "Dogs digest protein more efficiently than humans do.",
"tip_78": "Glucosamine from bone broth can help support joint health in aging dogs.",
"tip_79": "Small breed dogs have faster metabolisms and may need more calorie-dense foods."
```

**Portion guidance (80-99):**
```json
"tip_80": "Treats should make up no more than 10% of your dog's daily calorie intake.",
"tip_81": "A medium-sized dog (10-25 kg) typically needs 500-1000 calories per day.",
"tip_82": "Overweight dogs should have their portions reduced by 15-20%, not have meals skipped.",
"tip_83": "Feed puppies 3-4 smaller meals per day; adult dogs do well with 2 meals.",
"tip_84": "Use your dog's body condition score (BCS) to determine if portion sizes are right.",
"tip_85": "A healthy dog should have a visible waist when viewed from above.",
"tip_86": "Fruits should be given as occasional treats, not as meal replacements.",
"tip_87": "Small dogs need proportionally more calories per kg of body weight than large dogs.",
"tip_88": "Active and working dogs may need 40-70% more calories than sedentary dogs.",
"tip_89": "Pregnant dogs in their last trimester need about 25-50% more food than usual.",
"tip_90": "Monitor weight weekly when adjusting portions — changes of 1-2% per week are ideal.",
"tip_91": "Vegetables should make up about 10-20% of a homemade dog meal by volume.",
"tip_92": "One tablespoon of peanut butter is plenty as an occasional treat for a medium dog.",
"tip_93": "A handful of blueberries (5-10) is a good serving size for a medium-sized dog.",
"tip_94": "Reduce portion sizes slightly as your dog ages and becomes less active.",
"tip_95": "Weigh food portions rather than eyeballing — it's more accurate for weight management.",
"tip_96": "Dogs recovering from illness may need smaller, more frequent meals.",
"tip_97": "Raw bones should be size-appropriate — too small and they become a choking risk.",
"tip_98": "Liver is nutritious but should only make up about 5% of your dog's diet due to vitamin A content.",
"tip_99": "Consistency matters — try to feed at the same times each day for better digestion."
```

- [ ] **Step 3: Add Turkish tips to tr.json**

Add matching `"tips"` section to `src/messages/tr.json` with Turkish translations of all 100 tips. Same keys (`tip_0` through `tip_99`).

- [ ] **Step 4: Add analysisComplete key to both i18n files**

Add to `en.json`: `"analysisComplete": "Analysis Complete!"`
Add to `tr.json`: `"analysisComplete": "Analiz Tamamlandı!"`

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/messages/en.json src/messages/tr.json
git commit -m "feat: add 100 nutrition tips for analysis progress (EN + TR)"
```

---

### Task 10: Create Scattered Paws Component

**Files:**
- Create: `src/components/recipe/scattered-paws.tsx`

- [ ] **Step 1: Create ScatteredPaws component**

```typescript
// src/components/recipe/scattered-paws.tsx
"use client";

const PAW_PATH =
  "M7 5C7 3.34 5.88 2 4.5 2S2 3.34 2 5s1.12 3 2.5 3S7 6.66 7 5zm10 0c0-1.66-1.12-3-2.5-3S12 3.34 12 5s1.12 3 2.5 3S17 6.66 17 5zM4 12c0-1.66-1.12-3-2.5-3S-1 10.34-1 12s1.12 3 2.5 3S4 13.66 4 12zm20 0c0-1.66-1.12-3-2.5-3S19 10.34 19 12s1.12 3 2.5 3S24 13.66 24 12zM12 20c-4 0-7-3-7-6s2-4 4-3c1 .5 2 1.5 3 1.5s2-1 3-1.5c2-1 4 0 4 3s-3 6-7 6z";

interface PawConfig {
  top: string;
  left?: string;
  right?: string;
  opacity: number;
  size: number;
  rotation: number;
  animationDuration: string;
  animationDelay: string;
}

const PAWS: PawConfig[] = [
  { top: "8%", left: "5%", opacity: 0.06, size: 28, rotation: 0, animationDuration: "6s", animationDelay: "0s" },
  { top: "35%", right: "8%", opacity: 0.05, size: 22, rotation: 15, animationDuration: "8s", animationDelay: "0s" },
  { top: "65%", left: "10%", opacity: 0.04, size: 32, rotation: -20, animationDuration: "7s", animationDelay: "0s" },
  { top: "15%", right: "25%", opacity: 0.04, size: 18, rotation: 30, animationDuration: "9s", animationDelay: "1s" },
  { top: "50%", left: "75%", opacity: 0.035, size: 20, rotation: 45, animationDuration: "10s", animationDelay: "3s" },
  { top: "80%", right: "15%", opacity: 0.05, size: 24, rotation: -10, animationDuration: "7s", animationDelay: "2s" },
];

export function ScatteredPaws({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {PAWS.map((paw, i) => (
        <svg
          key={i}
          className="absolute motion-safe:animate-float"
          style={{
            top: paw.top,
            left: paw.left,
            right: paw.right,
            opacity: paw.opacity,
            width: paw.size,
            height: paw.size,
            transform: `rotate(${paw.rotation}deg)`,
            animationDuration: paw.animationDuration,
            animationDelay: paw.animationDelay,
          }}
          viewBox="0 0 24 24"
          fill="var(--color-primary)"
        >
          <path d={PAW_PATH} />
        </svg>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add float keyframe to globals.css**

Add inside the `@theme` block in `src/app/globals.css`:

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
```

And add the utility class:

```css
@utility animate-float {
  animation: float 6s ease-in-out infinite;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/scattered-paws.tsx src/app/globals.css
git commit -m "feat: add ScatteredPaws component with floating paw animations"
```

---

### Task 11: Create Checkmark Celebration Component

**Files:**
- Create: `src/components/recipe/checkmark-celebration.tsx`

- [ ] **Step 1: Create CheckmarkCelebration component**

```typescript
// src/components/recipe/checkmark-celebration.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CheckmarkCelebrationProps {
  onComplete: () => void;
}

export function CheckmarkCelebration({ onComplete }: CheckmarkCelebrationProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // trigger enter animation on next frame
    const enterTimer = requestAnimationFrame(() => setPhase("enter"));

    // start exit after 1.8s
    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 1800);

    // complete after exit animation (600ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas transition-opacity duration-[600ms] ease-out ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Circle */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
        style={{
          transform: phase !== "exit" ? "scale(1)" : "scale(1)",
          animation: "checkmark-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        {/* Checkmark SVG */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M10 20 L17 27 L30 13"
            className="motion-safe:animate-checkmark-draw"
          />
        </svg>
      </div>

      {/* Text */}
      <p
        className="mt-4 text-[17px] font-semibold text-txt"
        style={{
          animation: "checkmark-text 0.4s ease 0.7s both",
        }}
      >
        {t("analysisComplete")}
      </p>

      {/* Ring burst */}
      <div
        className="absolute h-20 w-20 rounded-full border-2 border-primary"
        style={{
          animation: "ring-burst 0.8s ease-out 0.4s both",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add checkmark animations to globals.css**

Add these keyframes and utilities to `src/app/globals.css`:

```css
@keyframes checkmark-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@keyframes checkmark-draw {
  0% { stroke-dashoffset: 40; }
  100% { stroke-dashoffset: 0; }
}

@keyframes checkmark-text {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes ring-burst {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

@utility animate-checkmark-draw {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: checkmark-draw 0.6s ease 0.3s forwards;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/checkmark-celebration.tsx src/app/globals.css
git commit -m "feat: add CheckmarkCelebration with SVG draw + ring burst animation"
```

---

### Task 12: Rewrite Analysis Progress Component

**Files:**
- Modify: `src/components/recipe/analysis-progress.tsx`

- [ ] **Step 1: Rewrite analysis-progress.tsx with all three phases**

Replace entire content of `src/components/recipe/analysis-progress.tsx`:

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ScatteredPaws } from "@/components/recipe/scattered-paws";
import { CheckmarkCelebration } from "@/components/recipe/checkmark-celebration";
import { AnalysisReport } from "@/components/recipe/analysis-report";
import { NUTRITION_TIPS } from "@/lib/constants";
import type { IngredientProgress } from "@/lib/types";
import type { AnalysisResult } from "@/lib/types";

interface AnalysisProgressProps {
  recipeName: string;
  ingredients: IngredientProgress[];
  result: AnalysisResult | null;
  status: "pending" | "completed" | "failed" | "idle";
}

type Phase = "progress" | "checkmark" | "report";

const CHIP_STYLES = {
  pending: "bg-[#F5F3F0] text-txt-tertiary border-border",
  checking: "bg-primary/10 text-primary border-primary/20 motion-safe:animate-pulse",
  safe: "bg-safe/10 text-safe border-safe/20",
  moderate: "bg-caution/10 text-caution border-caution/20",
  toxic: "bg-toxic/10 text-toxic border-toxic/20",
} as const;

const CHIP_ICONS: Record<string, string> = {
  pending: "",
  checking: "↻",
  safe: "✓",
  moderate: "⚠",
  toxic: "✕",
};

function getChipState(ing: IngredientProgress): keyof typeof CHIP_STYLES {
  if (ing.status === "pending") return "pending";
  if (ing.status === "checking") return "checking";
  if (ing.status === "done") return (ing.safety as "safe" | "moderate" | "toxic") ?? "safe";
  return "pending";
}

function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function AnalysisProgress({
  recipeName,
  ingredients,
  result,
  status,
}: AnalysisProgressProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<Phase>("progress");
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const tipsRef = useRef<string[]>([]);

  // Shuffle tips once on mount
  useEffect(() => {
    tipsRef.current = shuffleArray(NUTRITION_TIPS);
  }, []);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (phase !== "progress") return;
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % NUTRITION_TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  // Trigger checkmark when all ingredients done and result received
  useEffect(() => {
    if (
      status === "completed" &&
      result &&
      phase === "progress" &&
      ingredients.length > 0 &&
      ingredients.every((i) => i.status === "done")
    ) {
      // Small delay so user sees last ingredient complete
      const timer = setTimeout(() => setPhase("checkmark"), 600);
      return () => clearTimeout(timer);
    }
  }, [status, result, phase, ingredients]);

  const handleCelebrationComplete = useCallback(() => {
    setPhase("report");
  }, []);

  const doneCount = ingredients.filter((i) => i.status === "done").length;
  const totalCount = ingredients.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const currentTipKey = tipsRef.current[tipIndex] ?? NUTRITION_TIPS[0];

  if (phase === "report" && result) {
    return <AnalysisReport result={result} />;
  }

  return (
    <div className="relative min-h-[380px]">
      <ScatteredPaws
        className={`transition-opacity duration-500 ${phase === "checkmark" ? "opacity-0" : "opacity-100"}`}
      />

      {/* Progress phase */}
      {phase === "progress" && (
        <div className="relative z-[1]">
          {/* Determinate progress bar */}
          <div className="mb-4">
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${progressPct}%`,
                  transition: "width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
                }}
              />
            </div>
            <p className="text-center text-[13px] text-txt-secondary">
              {t("checkingIngredients", { count: totalCount })}
              {totalCount > 0 && ` (${doneCount}/${totalCount})`}
            </p>
          </div>

          {/* Ingredient chips */}
          <div className="mb-5 flex flex-wrap justify-center gap-1.5">
            {ingredients.map((ing) => {
              const state = getChipState(ing);
              const icon = CHIP_ICONS[state];
              return (
                <span
                  key={ing.id}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-400 ${CHIP_STYLES[state]}`}
                >
                  {icon && <span className="mr-1">{icon}</span>}
                  {ing.name}
                </span>
              );
            })}
          </div>

          {/* Tip card */}
          <div
            className="rounded-[14px] border border-border bg-surface p-4 text-center shadow-sm transition-opacity duration-400"
            style={{ opacity: tipVisible ? 1 : 0 }}
          >
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {t("didYouKnow")}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-txt-secondary">
              {t(`tips.${currentTipKey}`)}
            </p>
          </div>

          {/* Dot indicators */}
          <div className="mt-3 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  tipIndex % 3 === i ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Checkmark phase */}
      {phase === "checkmark" && (
        <CheckmarkCelebration onComplete={handleCelebrationComplete} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add didYouKnow key to i18n files**

Add to `en.json`: `"didYouKnow": "Did You Know?"`
Add to `tr.json`: `"didYouKnow": "Biliyor Muydunuz?"`

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/analysis-progress.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: rewrite AnalysisProgress with progress bar, chips, tips, and celebration"
```

---

### Task 13: Update Analysis Page to Use New Progress Component

**Files:**
- Modify: `src/app/(app)/recipes/analysis/page.tsx`

- [ ] **Step 1: Update analysis page to pass result and status to AnalysisProgress**

In `src/app/(app)/recipes/analysis/page.tsx`, the `AnalysisProgress` component now handles all three phases (progress → checkmark → report). Update the rendering logic.

Replace the streaming progress section (around line 117-121):

```typescript
        {/* Streaming progress */}
        {displayStatus === "pending" && recipe && (
          <AnalysisProgress
            recipeName={recipe.name}
            ingredients={ingredientProgress}
          />
        )}
```

With:

```typescript
        {/* Streaming progress + celebration + report */}
        {(displayStatus === "pending" || displayStatus === "completed") && recipe && (
          <AnalysisProgress
            recipeName={recipe.name}
            ingredients={ingredientProgress}
            result={displayResult}
            status={displayStatus}
          />
        )}
```

Remove the separate completed report section (the `{displayStatus === "completed" && displayResult && (...)}` block around lines 144-185) — `AnalysisProgress` now handles the report display after celebration.

But keep the stale banner and action buttons outside, only shown when phase is report (status completed and result exists and no active progress). Add a check:

```typescript
        {/* Action buttons — shown after report renders */}
        {displayStatus === "completed" && displayResult && ingredientProgress.length === 0 && (
          <>
            {isStale && (
              <button
                onClick={handleRetry}
                className="mb-4 flex w-full items-center gap-3 rounded-[14px] border border-caution/25 bg-caution/10 p-3.5 text-left transition-all duration-150 ease-out active:scale-[0.98] active:opacity-80"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-caution" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-caution">{t("analysisStale")}</p>
                  <p className="text-[12px] text-txt-secondary">{t("analysisStaleDesc")}</p>
                </div>
                <RefreshCw className="h-4 w-4 shrink-0 text-caution" />
              </button>
            )}

            {displayResult.follow_up_actions.length > 0 && (
              <div className="mt-4">
                <FollowUpActions
                  actions={displayResult.follow_up_actions}
                  onRecipeEdit={handleRecipeEdit}
                />
              </div>
            )}

            <div className="mt-4 flex gap-2.5">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push(`/recipes/edit?id=${recipeId}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("editRecipe")}
              </Button>
              <Button fullWidth onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("reAnalyze")}
              </Button>
            </div>
          </>
        )}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Verify app builds**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/recipes/analysis/page.tsx
git commit -m "feat: integrate new AnalysisProgress with celebration flow into analysis page"
```

---

### Task 14: Remove Skeleton Flash from Recipes Page

**Files:**
- Modify: `src/app/(app)/recipes/page.tsx`

- [ ] **Step 1: Update recipes page to skip skeleton when store has data**

In `src/app/(app)/recipes/page.tsx`, the `isLoading` check (lines 36-44) shows skeleton even when recipes are cached. Update:

Replace lines 36-44:

```typescript
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
```

With:

```typescript
  if (isLoading && recipes.length === 0) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/recipes/page.tsx
git commit -m "fix: skip skeleton on recipes page when store has cached data"
```

---

### Task 15: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run static build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 4: Commit any remaining fixes**

If any fixes were needed, commit them.
