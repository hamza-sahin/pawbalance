# UX State Persistence & Analysis Progress Redesign

**Date:** 2026-04-16
**Status:** Draft
**Scope:** Fix state loss on navigation, skeleton flash on tab switch, and static analysis progress screen

## Problem Statement

Three interconnected UX issues share common root causes:

1. **Analysis lost on navigate away** — Recipe analysis SSE stream lives in component-local `useState`. Navigation unmounts component → aborts stream → progress lost.
2. **Skeleton flash on every tab switch** — All data hooks start with `isLoading: true` and fetch on mount. No cache layer. Every tab switch = remount = re-fetch = skeleton.
3. **Static analysis progress** — `AnalysisProgress` component shows spinner + ingredient list with no animated transitions, no progress bar, no engagement while waiting.

### Affected Screens

| Screen | File | Issue |
|--------|------|-------|
| Recipe analysis | `src/app/(app)/recipes/analysis/page.tsx` | Issues 1 + 3 |
| Recipes list | `src/app/(app)/recipes/page.tsx` | Issue 2 (re-fetches on every visit) |
| Search home | `src/app/(app)/search/page.tsx` | Issue 2 (categories re-fetch) |
| Category foods | `src/app/(app)/search/category/page.tsx` | Issue 2 (foods re-fetch) |
| Food detail | `src/app/(app)/search/food/page.tsx` | Issues 1 + 2 (AI lookup lost, DB food re-fetch) |
| Profile | `src/app/(app)/profile/page.tsx` | Issue 2 (pet data re-renders) |

## Approach

**Zustand-based full state persistence (Option B)**. Extend existing Zustand stores with cache-first rendering. No new dependencies.

## Design

### 1. Global Analysis Manager

**Current:** `useRecipeAnalysis` hook manages SSE connection and all state (`status`, `ingredientProgress`, `result`, `error`) in local `useState`. Component unmount aborts connection.

**New:** Move analysis stream management into `recipe-store.ts`.

#### Store Changes (`src/store/recipe-store.ts`)

Add to `RecipeState`:

```typescript
// Analysis stream state (global, survives navigation)
activeAnalysis: {
  recipeId: string;
  status: AnalysisStatus | "idle";
  ingredientProgress: IngredientProgress[];
  result: AnalysisResult | null;
  error: string | null;
} | null;

// Actions
startAnalysis: (recipeId: string, petId: string | null, locale: string, accessToken: string) => void;
abortAnalysis: () => void;
clearAnalysis: () => void;
```

#### Stream Management

- `startAnalysis` creates `AbortController`, stores ref in closure, initiates `fetch` with SSE parsing
- SSE events update store state directly (`set(...)`)
- `AbortController` ref stored outside React (module-level variable or store middleware)
- On `result` event: save to `analyses` map AND update `activeAnalysis.status = "completed"`
- On navigation back to analysis page: hook reads from `activeAnalysis` — shows current progress or completed result
- `abortAnalysis` called only on explicit user cancel, NOT on unmount

#### Hook Changes (`src/hooks/use-recipe-analysis.ts`)

Becomes a thin wrapper:

```typescript
export function useRecipeAnalysis() {
  const activeAnalysis = useRecipeStore((s) => s.activeAnalysis);
  const startAnalysis = useRecipeStore((s) => s.startAnalysis);
  const abortAnalysis = useRecipeStore((s) => s.abortAnalysis);

  return {
    status: activeAnalysis?.status ?? "idle",
    ingredientProgress: activeAnalysis?.ingredientProgress ?? [],
    result: activeAnalysis?.result ?? null,
    error: activeAnalysis?.error ?? null,
    analyze: startAnalysis,
    abort: abortAnalysis,
  };
}
```

#### Analysis Page Changes (`src/app/(app)/recipes/analysis/page.tsx`)

- Remove local `useRecipeAnalysis` state management
- Read from store: if `activeAnalysis?.recipeId === recipeId`, show current progress
- If `activeAnalysis` is null or different recipe, start new analysis
- On completion: show checkmark animation → crossfade to report (new component)

### 2. Food Store (New: `src/store/food-store.ts`)

**Current:** `useFoodSearch`, `useCategories`, `useFoodsByCategory`, `useFoodDetail` all use local `useState`. Data lost on unmount.

**New:** Zustand store for food data with cache-first pattern.

```typescript
interface FoodState {
  // Categories (fetched once, rarely changes)
  categories: FoodCategory[];
  categoriesLoadedAt: number | null;

  // Foods by category (keyed by category name)
  foodsByCategory: Record<string, Food[]>;

  // Food details (keyed by food ID)
  foodDetails: Record<string, Food>;

  // Search (last search preserved)
  lastSearch: { query: string; results: Food[] } | null;

  // Actions
  setCategories: (cats: FoodCategory[]) => void;
  setFoodsByCategory: (category: string, foods: Food[]) => void;
  setFoodDetail: (id: string, food: Food) => void;
  setLastSearch: (query: string, results: Food[]) => void;
}
```

#### Cache-First Pattern

Each hook follows same pattern:

```
1. Read from store → if data exists, render immediately (no skeleton)
2. Check staleness (e.g., categoriesLoadedAt > 5 min ago)
3. If stale or missing → fetch in background → update store silently
```

Staleness thresholds:
- Categories: 5 minutes (rarely change)
- Foods by category: 5 minutes
- Food details: 10 minutes (static data)
- Search results: no cache (always re-search on new query, but preserve last results for back-navigation)

#### Hook Changes

`useCategories`:
```typescript
export function useCategories() {
  const { categories, categoriesLoadedAt, setCategories } = useFoodStore();
  const isStale = !categoriesLoadedAt || Date.now() - categoriesLoadedAt > 5 * 60 * 1000;
  const isLoading = categories.length === 0; // only true on first load

  useEffect(() => {
    if (isStale) fetchAndSet();
  }, [isStale]);

  return { categories, isLoading, fetchCategories: fetchAndSet };
}
```

Same pattern for `useFoodsByCategory`, `useFoodDetail`, `useFoodSearch`.

### 3. Recipe Store Cache Enhancements (`src/store/recipe-store.ts`)

**Current:** `recipes` array exists in store but `isLoading` starts as `false` and `fetchRecipes()` sets it to `true` on every call. Recipes page shows skeleton while fetching even if data exists.

**Changes:**

Add `recipesLoadedAt: number | null` to track staleness.

Update `useRecipes` hook:
- If `recipes.length > 0`, render immediately (no skeleton)
- Background re-fetch if stale (> 30 seconds, since recipes change more frequently)
- `isLoading` only `true` when `recipes.length === 0` (first load)

### 4. Analysis Progress Redesign (`src/components/recipe/analysis-progress.tsx`)

Complete rewrite with three phases:

#### Phase 1: Progress (while ingredients being checked)

- **Determinate progress bar** — thin 4px bar, iOS-style, width = `(completedCount / totalCount) * 100%`, smooth `cubic-bezier(0.25, 0.1, 0.25, 1)` transition
- **Ingredient chips** — compact horizontal pills with animated state transitions:
  - Pending: gray background, no icon
  - Checking: primary color, rotating `↻` icon, `pulse` animation
  - Done/Safe: green bg, `✓` icon
  - Done/Caution: amber bg, `⚠` icon
  - Done/Toxic: red bg, `✕` icon
- **Scattered paw icons** — 6 SVG paw prints positioned absolutely, low opacity (0.04-0.06), gentle float animations (6-10s periods, different phases), `pointer-events: none`
- **"Did You Know?" tip card** — rotates every 5 seconds with fade transition (opacity 0→1 over 400ms). Flanked by small paw icons. Dot indicators below (3 dots cycling).

#### Phase 2: Completion Celebration (~1.8s)

Triggered when all ingredients are done:

1. Progress view fades out (opacity 0, 500ms)
2. Green circle pops in (scale 0→1, spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`, 500ms)
3. SVG checkmark draws in (stroke-dashoffset animation, 600ms, 300ms delay)
4. "Analysis Complete!" text slides up + fades in (400ms, 700ms delay)
5. Ring burst expands outward (scale 1→2.5, fade to 0, 800ms)
6. Paw layer fades out

#### Phase 3: Crossfade to Report

After 1.8s celebration:
1. Checkmark overlay fades out (600ms)
2. Analysis report fades in simultaneously (600ms)
3. Report view is the existing `AnalysisReport` component

#### Component Structure

```
<AnalysisProgress>
  <ScatteredPaws />           // Absolute positioned floating paws
  {phase === 'progress' && <ProgressView />}
  {phase === 'checkmark' && <CheckmarkCelebration />}
  {phase === 'report' && <AnalysisReport />}
</AnalysisProgress>
```

### 5. Nutrition Tips (`src/lib/constants.ts`)

Add `NUTRITION_TIPS` array with 100 entries, sourced from food safety data in our Supabase DB:

```typescript
export const NUTRITION_TIPS: string[] = [
  "tip_0", "tip_1", ... "tip_99"  // i18n keys
];
```

Actual tip text in `messages/en.json` and `messages/tr.json` under `tips` namespace.

**Tip categories (roughly 20 each):**
- Safe foods and their benefits (e.g., "Blueberries are packed with antioxidants...")
- Toxic food warnings (e.g., "Grapes can cause kidney failure...")
- Preparation tips (e.g., "Always cook chicken thoroughly before feeding...")
- Nutrition facts (e.g., "Dogs need 1-2g of protein per kg of body weight...")
- Portion guidance (e.g., "Treats should make up no more than 10% of daily calories...")

**Selection:** Random tip on mount, cycle through shuffled subset every 5 seconds. No repeats within a session.

### 6. AI Food Lookup Persistence

**Current:** `useAIFoodLookup` hook in `search/food/page.tsx` uses local state. Navigate away mid-stream → result lost.

**Change:** Add AI lookup state to `food-store`:

```typescript
// In FoodState
aiLookup: {
  query: string;
  status: "idle" | "loading" | "done" | "error";
  result: AIFoodResult | null;
  error: string | null;
} | null;
```

Same pattern as analysis manager — stream managed at store level, survives navigation.

## Files Changed

| File | Change |
|------|--------|
| `src/store/recipe-store.ts` | Add `activeAnalysis` state + stream management actions |
| `src/store/food-store.ts` | **New file** — categories, foods, search, AI lookup cache |
| `src/hooks/use-recipe-analysis.ts` | Thin wrapper reading from store |
| `src/hooks/use-food-search.ts` | All hooks read from `food-store`, cache-first pattern |
| `src/hooks/use-ai-food-lookup.ts` | Stream managed in `food-store` |
| `src/hooks/use-recipes.ts` | Cache-first: skip skeleton if store has data |
| `src/components/recipe/analysis-progress.tsx` | Full rewrite: progress bar, chips, paws, tips, checkmark, crossfade |
| `src/components/recipe/scattered-paws.tsx` | **New file** — floating paw SVGs component |
| `src/components/recipe/checkmark-celebration.tsx` | **New file** — SVG checkmark + ring burst animation |
| `src/lib/constants.ts` | Add `NUTRITION_TIPS` array (100 i18n keys) |
| `src/messages/en.json` | Add 100 tip translations |
| `src/messages/tr.json` | Add 100 tip translations |
| `src/app/(app)/recipes/analysis/page.tsx` | Use store-based analysis, add completion animation flow |
| `src/app/(app)/recipes/page.tsx` | Remove skeleton when store has data |
| `src/app/(app)/search/page.tsx` | Cache-first categories |
| `src/app/(app)/search/category/page.tsx` | Cache-first foods by category |
| `src/app/(app)/search/food/page.tsx` | Cache-first food detail + persistent AI lookup |

## Out of Scope

- Service workers / offline caching
- Optimistic updates
- Infinite scroll / pagination
- react-query or SWR migration
- Push notification for analysis completion
