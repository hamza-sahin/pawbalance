# AI-Powered Recipe Analysis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recipe creation with AI-powered safety analysis to PawBalance, replacing the Bowl tab with a Recipes section powered by pi-agent-core.

**Architecture:** Single Next.js codebase with dual build mode (static for Capacitor, server for K8s). API route runs a pi-agent-core Agent with custom tools that query the food safety database. SSE streaming delivers real-time analysis progress to the client. Follow-up actions let users apply ingredient swaps and view detailed advice without leaving the report.

**Tech Stack:** Next.js 15 (App Router), pi-agent-core + pi-ai, Supabase (PostgreSQL + RLS), Zustand, Zod, Tailwind CSS 4, next-intl, Lucide React, TypeBox

**Spec:** `docs/superpowers/specs/2026-04-03-ai-recipe-analysis-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/agent/tools/lookup-food.ts` | Agent tool: queries foods table via search_foods RPC |
| `src/lib/agent/tools/get-pet-profile.ts` | Agent tool: fetches pet from Supabase |
| `src/lib/agent/system-prompt.ts` | Builds the system prompt with locale and output schema |
| `src/lib/agent/create-agent.ts` | Factory: creates a configured Agent instance |
| `src/lib/api.ts` | Client-side API helper (base URL, fetch wrapper) |
| `src/app/api/recipes/analyze/route.ts` | POST handler: runs agent, streams SSE |
| `src/store/recipe-store.ts` | Zustand store for recipes list + selected recipe |
| `src/hooks/use-recipes.ts` | Recipe CRUD: create, update, delete, fetch |
| `src/hooks/use-recipe-analysis.ts` | SSE client for analysis streaming |
| `src/app/(app)/recipes/page.tsx` | Recipe list page |
| `src/app/(app)/recipes/new/page.tsx` | Create recipe page |
| `src/app/(app)/recipes/edit/page.tsx` | Edit recipe page |
| `src/app/(app)/recipes/analysis/page.tsx` | Analysis streaming + report page |
| `src/components/recipe/recipe-card.tsx` | Recipe list card with safety badge |
| `src/components/recipe/recipe-form.tsx` | Full recipe form (name, pet, ingredients, actions) |
| `src/components/recipe/ingredient-list.tsx` | Ingredient rows with add/remove |
| `src/components/recipe/preparation-chips.tsx` | Chip selector for preparation method |
| `src/components/recipe/analysis-progress.tsx` | Streaming progress (per-ingredient) |
| `src/components/recipe/analysis-report.tsx` | Structured report display |
| `src/components/recipe/follow-up-actions.tsx` | Recipe edit + detail card actions |
| `supabase/migrations/001_recipes.sql` | SQL migration for 3 new tables + RLS |
| `Dockerfile.server` | Server-mode Dockerfile for K8s |

### Modified Files

| File | Change |
|------|--------|
| `next.config.ts` | Conditional `output: 'export'` based on `BUILD_MODE` |
| `package.json` | New deps + build scripts |
| `src/lib/types.ts` | Add Recipe, RecipeIngredient, RecipeAnalysis, AnalysisResult types |
| `src/lib/validators.ts` | Add recipeFormSchema, ingredientSchema |
| `src/lib/access.ts` | Add `/recipes` route access tier |
| `src/components/navigation/bottom-nav.tsx` | Replace bowl tab with recipes |
| `src/messages/en.json` | Add recipe-related i18n keys |
| `src/messages/tr.json` | Add recipe-related i18n keys |
| `scripts/deploy-testflight.sh` | Use `npm run build:static` |

### Removed Files

| File | Reason |
|------|--------|
| `src/app/(app)/bowl/page.tsx` | Replaced by `/recipes` |

---

## Task 1: Build Configuration & Dependencies

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `scripts/deploy-testflight.sh`
- Create: `Dockerfile.server`

- [ ] **Step 1: Make next.config.ts output conditional**

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === "server" ? undefined : "export",
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Add build scripts to package.json**

Add to `"scripts"`:
```json
"build:static": "next build",
"build:server": "BUILD_MODE=server next build"
```

- [ ] **Step 3: Install pi-agent-core dependencies**

```bash
npm install @mariozechner/pi-agent-core @mariozechner/pi-ai @sinclair/typebox
```

If these packages are not published to npm, install from the local monorepo:
```bash
npm install ./refs/pi-mono/packages/agent ./refs/pi-mono/packages/ai
npm install @sinclair/typebox
```

- [ ] **Step 4: Update deploy-testflight.sh**

In `scripts/deploy-testflight.sh`, change:
```bash
npm run build
```
to:
```bash
npm run build:static
```

- [ ] **Step 5: Create Dockerfile.server**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
RUN BUILD_MODE=server npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Note: For standalone output, add `output: "standalone"` when `BUILD_MODE === "server"`. Update next.config.ts:

```typescript
const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === "server" ? "standalone" : "export",
  images: {
    unoptimized: true,
  },
};
```

- [ ] **Step 6: Verify static build still works**

```bash
npm run build:static
```

Expected: Build succeeds, `out/` directory created with static files.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts package.json package-lock.json scripts/deploy-testflight.sh Dockerfile.server
git commit -m "feat: add dual build mode and pi-agent-core dependencies"
```

---

## Task 2: Types & Validation

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/validators.ts`

- [ ] **Step 1: Add recipe types to src/lib/types.ts**

Add after the existing `FoodRequest` type:

```typescript
/* ── Recipes ─────────────────────────────────────── */

export interface Recipe {
  id: string;
  owner_id: string;
  pet_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  preparation: string;
  sort_order: number;
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredient[];
}

export type AnalysisSafety = "safe" | "moderate" | "toxic";

export interface AnalysisIngredient {
  name: string;
  safety_level: AnalysisSafety;
  preparation_ok: boolean;
  notes: string;
}

export interface RecipeEditAction {
  type: "recipe_edit";
  label: string;
  ingredient_id: string;
  new_name: string;
  new_preparation: string;
}

export type DetailCardIcon = "pill" | "heart" | "alert" | "lightbulb" | "shield";

export interface DetailCardAction {
  type: "detail_card";
  label: string;
  icon: DetailCardIcon;
  detail: string;
}

export type FollowUpAction = RecipeEditAction | DetailCardAction;

export interface AnalysisResult {
  overall_safety: AnalysisSafety;
  ingredients: AnalysisIngredient[];
  safety_alerts: string[];
  preparation_warnings: string[];
  benefits_summary: string[];
  suggestions: string[];
  follow_up_actions: FollowUpAction[];
}

export type AnalysisStatus = "pending" | "completed" | "failed";

export interface RecipeAnalysis {
  id: string;
  recipe_id: string;
  pet_id: string | null;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  model_used: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Add recipe validation schemas to src/lib/validators.ts**

Add after the existing `petFormSchema`:

```typescript
export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100),
  preparation: z.string().min(1, "Preparation method is required").max(100),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  pet_id: z.string().nullable(),
  ingredients: z
    .array(ingredientSchema)
    .min(1, "Add at least one ingredient"),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
```

- [ ] **Step 3: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/validators.ts
git commit -m "feat: add recipe and analysis type definitions and validation schemas"
```

---

## Task 3: Supabase Migration

**Files:**
- Create: `supabase/migrations/001_recipes.sql`

- [ ] **Step 1: Create migration SQL file**

```sql
-- Create recipes table
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create recipe_ingredients table
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  preparation text not null,
  sort_order integer not null default 0
);

-- Create recipe_analyses table
create table if not exists public.recipe_analyses (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  result jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_recipes_owner on public.recipes(owner_id);
create index idx_recipe_ingredients_recipe on public.recipe_ingredients(recipe_id);
create index idx_recipe_analyses_recipe on public.recipe_analyses(recipe_id);

-- RLS for recipes
alter table public.recipes enable row level security;

create policy "Users can read own recipes"
  on public.recipes for select
  using (auth.uid() = owner_id);

create policy "Users can insert own recipes"
  on public.recipes for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own recipes"
  on public.recipes for update
  using (auth.uid() = owner_id);

create policy "Users can delete own recipes"
  on public.recipes for delete
  using (auth.uid() = owner_id);

-- RLS for recipe_ingredients (via recipe ownership)
alter table public.recipe_ingredients enable row level security;

create policy "Users can read own recipe ingredients"
  on public.recipe_ingredients for select
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can insert own recipe ingredients"
  on public.recipe_ingredients for insert
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can update own recipe ingredients"
  on public.recipe_ingredients for update
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can delete own recipe ingredients"
  on public.recipe_ingredients for delete
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

-- RLS for recipe_analyses (via recipe ownership)
alter table public.recipe_analyses enable row level security;

create policy "Users can read own recipe analyses"
  on public.recipe_analyses for select
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_analyses.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

create policy "Users can insert own recipe analyses"
  on public.recipe_analyses for insert
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_analyses.recipe_id
        and recipes.owner_id = auth.uid()
    )
  );

-- Updated_at trigger for recipes
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.update_updated_at();
```

- [ ] **Step 2: Run migration in Supabase**

Run the SQL in the Supabase SQL Editor (Dashboard → SQL Editor → paste and run).

- [ ] **Step 3: Verify tables exist**

In Supabase Dashboard → Table Editor, confirm `recipes`, `recipe_ingredients`, and `recipe_analyses` tables appear with correct columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_recipes.sql
git commit -m "feat: add Supabase migration for recipes, ingredients, and analyses tables"
```

---

## Task 4: Navigation & Access Control Update

**Files:**
- Modify: `src/components/navigation/bottom-nav.tsx`
- Modify: `src/lib/access.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`
- Remove: `src/app/(app)/bowl/page.tsx`

- [ ] **Step 1: Update bottom-nav.tsx tabs**

Replace the `tabs` array:

```typescript
const tabs = [
  { key: "scanner", href: "/scan", label: "scanner" },
  { key: "recipes", href: "/recipes", label: "recipes" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;
```

Update the icon map to replace `"bowl"` with `"recipes"`. Use the CookingPot or UtensilsCrossed icon from Lucide for the recipes tab:

```typescript
import { Search, ScanLine, BookOpen, User, UtensilsCrossed } from "lucide-react";

const icons: Record<string, React.ReactNode> = {
  scanner: <ScanLine className="h-5 w-5" />,
  recipes: <UtensilsCrossed className="h-5 w-5" />,
  search: <Search className="h-5 w-5" />,
  learn: <BookOpen className="h-5 w-5" />,
  profile: <User className="h-5 w-5" />,
};
```

- [ ] **Step 2: Update access.ts route map**

Replace the `"/bowl"` entry with `"/recipes"`:

```typescript
const ROUTE_ACCESS: Record<string, AccessTier> = {
  "/search": "guest",
  "/profile": "guest",
  "/recipes": "free",
  "/learn": "guest",
  "/scan": "premium",
};
```

Recipes require `"free"` tier (must be logged in) — not guest, not premium. Creating and viewing recipes is available to all authenticated users. AI analysis is gated in the UI (not at route level).

- [ ] **Step 3: Add i18n keys to en.json**

Add to `src/messages/en.json`:

```json
"recipes": "Recipes",
"myRecipes": "My Recipes",
"newRecipe": "New Recipe",
"editRecipe": "Edit Recipe",
"recipeName": "Recipe Name",
"recipeNamePlaceholder": "Give your recipe a name",
"forWhichPet": "For which pet?",
"nonePet": "None",
"ingredients": "Ingredients",
"addIngredient": "Add Ingredient",
"ingredientNamePlaceholder": "Ingredient name (e.g. salmon, pumpkin...)",
"preparationMethod": "Preparation",
"preparationRaw": "Raw",
"preparationBoiled": "Boiled",
"preparationCooked": "Cooked",
"preparationGrilled": "Grilled",
"preparationSteamed": "Steamed",
"preparationCustom": "Custom...",
"analyzeRecipe": "Analyze Recipe",
"reAnalyze": "Re-analyze",
"noRecipesYet": "No recipes yet",
"noRecipesDescription": "Create your first recipe and get AI-powered safety analysis",
"noIngredientsYet": "No ingredients added yet",
"recipeNameRequired": "Recipe name is required",
"addAtLeastOneIngredient": "Add at least one ingredient",
"ingredientNameRequired": "Enter an ingredient name",
"analyzing": "Analyzing...",
"analyzingRecipe": "Analyzing {recipeName}",
"checkingIngredients": "Checking {count} ingredients...",
"ingredientChecking": "Checking...",
"ingredientPending": "Pending",
"overallSafety": "Overall Safety",
"safetyAlerts": "Safety Alerts",
"preparationTips": "Preparation Tips",
"benefitsSummary": "Benefits",
"suggestionsSummary": "Suggestions",
"analysisFailed": "Analysis failed",
"analysisFailedDescription": "Something went wrong while analyzing your recipe. Please try again.",
"tryAgain": "Try Again",
"notAnalyzed": "Not analyzed",
"ingredientCount": "{count} ingredients",
"alertCount": "{count, plural, one {# alert} other {# alerts}}",
"upgradeToAnalyze": "Upgrade to Premium to analyze recipes",
"saveRecipe": "Save Recipe",
"deleteRecipe": "Delete Recipe",
"deleteRecipeConfirm": "Are you sure you want to delete this recipe?",
"recipeSaved": "Recipe saved",
"recipeDeleted": "Recipe deleted",
"recipeAnalysis": "Recipe Analysis"
```

- [ ] **Step 4: Add i18n keys to tr.json**

Add the same keys with Turkish translations to `src/messages/tr.json`:

```json
"recipes": "Tarifler",
"myRecipes": "Tariflerim",
"newRecipe": "Yeni Tarif",
"editRecipe": "Tarifi Düzenle",
"recipeName": "Tarif Adı",
"recipeNamePlaceholder": "Tarifinize bir isim verin",
"forWhichPet": "Hangi evcil hayvan için?",
"nonePet": "Yok",
"ingredients": "Malzemeler",
"addIngredient": "Malzeme Ekle",
"ingredientNamePlaceholder": "Malzeme adı (örn. somon, balkabağı...)",
"preparationMethod": "Hazırlama",
"preparationRaw": "Çiğ",
"preparationBoiled": "Haşlanmış",
"preparationCooked": "Pişmiş",
"preparationGrilled": "Izgara",
"preparationSteamed": "Buğulanmış",
"preparationCustom": "Diğer...",
"analyzeRecipe": "Tarifi Analiz Et",
"reAnalyze": "Tekrar Analiz Et",
"noRecipesYet": "Henüz tarif yok",
"noRecipesDescription": "İlk tarifinizi oluşturun ve yapay zeka destekli güvenlik analizi alın",
"noIngredientsYet": "Henüz malzeme eklenmedi",
"recipeNameRequired": "Tarif adı gerekli",
"addAtLeastOneIngredient": "En az bir malzeme ekleyin",
"ingredientNameRequired": "Malzeme adını girin",
"analyzing": "Analiz ediliyor...",
"analyzingRecipe": "{recipeName} analiz ediliyor",
"checkingIngredients": "{count} malzeme kontrol ediliyor...",
"ingredientChecking": "Kontrol ediliyor...",
"ingredientPending": "Bekliyor",
"overallSafety": "Genel Güvenlik",
"safetyAlerts": "Güvenlik Uyarıları",
"preparationTips": "Hazırlama İpuçları",
"benefitsSummary": "Faydaları",
"suggestionsSummary": "Öneriler",
"analysisFailed": "Analiz başarısız oldu",
"analysisFailedDescription": "Tarifiniz analiz edilirken bir hata oluştu. Lütfen tekrar deneyin.",
"tryAgain": "Tekrar Dene",
"notAnalyzed": "Analiz edilmedi",
"ingredientCount": "{count} malzeme",
"alertCount": "{count} uyarı",
"upgradeToAnalyze": "Tarifleri analiz etmek için Premium'a yükseltin",
"saveRecipe": "Tarifi Kaydet",
"deleteRecipe": "Tarifi Sil",
"deleteRecipeConfirm": "Bu tarifi silmek istediğinizden emin misiniz?",
"recipeSaved": "Tarif kaydedildi",
"recipeDeleted": "Tarif silindi",
"recipeAnalysis": "Tarif Analizi"
```

- [ ] **Step 5: Delete bowl page**

```bash
rm src/app/\(app\)/bowl/page.tsx
```

If there's a bowl directory, remove the whole directory:

```bash
rm -rf src/app/\(app\)/bowl
```

- [ ] **Step 6: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds. The `/bowl` route is gone; `/recipes` tab appears in navigation.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace Bowl tab with Recipes, update nav and access control"
```

---

## Task 5: Recipe Zustand Store

**Files:**
- Create: `src/store/recipe-store.ts`

- [ ] **Step 1: Create the recipe store**

```typescript
"use client";

import { create } from "zustand";
import type { RecipeWithIngredients, RecipeAnalysis } from "@/lib/types";

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
}

export const useRecipeStore = create<RecipeState>((set) => ({
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
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/recipe-store.ts
git commit -m "feat: add Zustand recipe store"
```

---

## Task 6: Recipe CRUD Hook

**Files:**
- Create: `src/hooks/use-recipes.ts`

- [ ] **Step 1: Create the recipe CRUD hook**

```typescript
"use client";

import { useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRecipeStore } from "@/store/recipe-store";
import { useAuthStore } from "@/store/auth-store";
import type {
  RecipeWithIngredients,
  RecipeIngredient,
  RecipeAnalysis,
} from "@/lib/types";
import type { RecipeFormValues } from "@/lib/validators";

export function useRecipes() {
  const { user } = useAuthStore();
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
  } = useRecipeStore();

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecipes(data as RecipeWithIngredients[]);

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
  }, [user, setRecipes, setLoading, setAnalysis]);

  const createRecipe = useCallback(
    async (values: RecipeFormValues): Promise<RecipeWithIngredients> => {
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      // Insert recipe
      const { data: recipe, error } = await supabase
        .from("recipes")
        .insert({
          owner_id: user.id,
          name: values.name,
          pet_id: values.pet_id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert ingredients
      const ingredients = values.ingredients.map((ing, i) => ({
        recipe_id: recipe.id,
        name: ing.name,
        preparation: ing.preparation,
        sort_order: i,
      }));
      const { data: ingData, error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredients)
        .select();
      if (ingError) throw ingError;

      const full: RecipeWithIngredients = {
        ...recipe,
        recipe_ingredients: ingData as RecipeIngredient[],
      };
      addRecipe(full);
      return full;
    },
    [user, addRecipe],
  );

  const editRecipe = useCallback(
    async (
      recipeId: string,
      values: RecipeFormValues,
    ): Promise<RecipeWithIngredients> => {
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      // Update recipe
      const { data: recipe, error } = await supabase
        .from("recipes")
        .update({ name: values.name, pet_id: values.pet_id })
        .eq("id", recipeId)
        .select()
        .single();
      if (error) throw error;

      // Replace all ingredients (delete + insert)
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);

      const ingredients = values.ingredients.map((ing, i) => ({
        recipe_id: recipeId,
        name: ing.name,
        preparation: ing.preparation,
        sort_order: i,
      }));
      const { data: ingData, error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredients)
        .select();
      if (ingError) throw ingError;

      const full: RecipeWithIngredients = {
        ...recipe,
        recipe_ingredients: ingData as RecipeIngredient[],
      };
      updateRecipe(full);
      return full;
    },
    [user, updateRecipe],
  );

  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);
      if (error) throw error;
      removeRecipe(recipeId);
    },
    [removeRecipe],
  );

  const applyIngredientSwap = useCallback(
    async (
      recipeId: string,
      ingredientId: string,
      newName: string,
      newPreparation: string,
    ): Promise<RecipeWithIngredients> => {
      const supabase = getSupabase();
      await supabase
        .from("recipe_ingredients")
        .update({ name: newName, preparation: newPreparation })
        .eq("id", ingredientId);

      // Re-fetch recipe to get updated state
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("id", recipeId)
        .single();
      if (error) throw error;
      const full = data as RecipeWithIngredients;
      updateRecipe(full);
      return full;
    },
    [updateRecipe],
  );

  return {
    recipes,
    isLoading,
    analyses,
    fetchRecipes,
    createRecipe,
    editRecipe,
    deleteRecipe,
    applyIngredientSwap,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-recipes.ts
git commit -m "feat: add recipe CRUD hook with Supabase queries"
```

---

## Task 7: Recipe UI Components

**Files:**
- Create: `src/components/recipe/preparation-chips.tsx`
- Create: `src/components/recipe/ingredient-list.tsx`
- Create: `src/components/recipe/recipe-card.tsx`
- Create: `src/components/recipe/recipe-form.tsx`

- [ ] **Step 1: Create PreparationChips component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const PRESET_METHODS = [
  "Raw",
  "Boiled",
  "Cooked",
  "Grilled",
  "Steamed",
] as const;

const METHOD_KEYS: Record<string, string> = {
  Raw: "preparationRaw",
  Boiled: "preparationBoiled",
  Cooked: "preparationCooked",
  Grilled: "preparationGrilled",
  Steamed: "preparationSteamed",
};

interface PreparationChipsProps {
  value: string;
  onChange: (value: string) => void;
}

export function PreparationChips({ value, onChange }: PreparationChipsProps) {
  const t = useTranslations();
  const [showCustom, setShowCustom] = useState(false);
  const isPreset = PRESET_METHODS.includes(value as any);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-txt-secondary">
        {t("preparationMethod")}
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            className={`min-h-[36px] cursor-pointer touch-manipulation rounded-[10px] border px-3 text-[13px] font-medium transition-colors duration-150 ${
              value === method
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-txt-secondary"
            }`}
            onClick={() => {
              setShowCustom(false);
              onChange(method);
            }}
          >
            {t(METHOD_KEYS[method])}
          </button>
        ))}
        <button
          type="button"
          className={`min-h-[36px] cursor-pointer touch-manipulation rounded-[10px] border border-dashed px-3 text-[13px] font-medium transition-colors duration-150 ${
            showCustom || (!isPreset && value)
              ? "border-primary bg-primary text-white"
              : "border-border-secondary text-txt-secondary"
          }`}
          onClick={() => {
            setShowCustom(true);
            if (isPreset) onChange("");
          }}
        >
          {t("preparationCustom")}
        </button>
      </div>
      {showCustom && (
        <Input
          className="mt-2"
          placeholder={t("preparationMethod")}
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create IngredientList component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreparationChips } from "./preparation-chips";
import type { IngredientFormValues } from "@/lib/validators";

interface IngredientListProps {
  ingredients: IngredientFormValues[];
  onChange: (ingredients: IngredientFormValues[]) => void;
  error?: string;
}

export function IngredientList({
  ingredients,
  onChange,
  error,
}: IngredientListProps) {
  const t = useTranslations();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [preparation, setPreparation] = useState("Raw");
  const [nameError, setNameError] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      setNameError(t("ingredientNameRequired"));
      return;
    }
    onChange([...ingredients, { name: name.trim(), preparation }]);
    setName("");
    setPreparation("Raw");
    setNameError("");
    setShowForm(false);
  };

  const handleRemove = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-txt-secondary">
        {t("ingredients")}
      </label>

      {ingredients.length > 0 && (
        <Card className="mb-3">
          {ingredients.map((ing, i) => (
            <div
              key={i}
              className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
                i < ingredients.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-txt">{ing.name}</p>
                <p className="text-xs text-txt-secondary">{ing.preparation}</p>
              </div>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] transition-colors hover:bg-canvas"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${ing.name}`}
              >
                <X className="h-[18px] w-[18px] text-txt-tertiary" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {ingredients.length === 0 && !showForm && (
        <Card
          className={`mb-3 p-6 text-center ${error ? "border-error" : ""}`}
        >
          <Plus className="mx-auto mb-2 h-6 w-6 text-txt-tertiary" />
          <p className="text-sm text-txt-tertiary">{t("noIngredientsYet")}</p>
        </Card>
      )}

      {error && (
        <p className="mb-2 text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {showForm ? (
        <div className="mb-4 rounded-[14px] border border-border bg-canvas p-3.5">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-txt-secondary">
            {t("addIngredient")}
          </p>
          <Input
            placeholder={t("ingredientNamePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            autoFocus
          />
          <div className="mt-2">
            <PreparationChips value={preparation} onChange={setPreparation} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => {
                setShowForm(false);
                setName("");
                setNameError("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              fullWidth
              size="sm"
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              {t("addIngredient")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-border-secondary p-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          {t("addIngredient")}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create RecipeCard component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SafetyBadge } from "@/components/food/safety-badge";
import type { RecipeWithIngredients, RecipeAnalysis } from "@/lib/types";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  analysis?: RecipeAnalysis;
  petName?: string;
}

export function RecipeCard({ recipe, analysis, petName }: RecipeCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const ingredientNames = recipe.recipe_ingredients
    .map((i) => i.name)
    .join(", ");

  const safetyLevel = analysis?.result?.overall_safety;
  const alertCount =
    analysis?.result?.safety_alerts?.length ?? 0;

  const handleTap = () => {
    if (analysis?.status === "completed") {
      router.push(`/recipes/analysis?id=${recipe.id}`);
    } else {
      router.push(`/recipes/edit?id=${recipe.id}`);
    }
  };

  return (
    <Card
      className="cursor-pointer touch-manipulation p-4 transition-colors active:bg-canvas"
      onClick={handleTap}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-txt">{recipe.name}</p>
          <p className="truncate text-[13px] text-txt-secondary">
            {ingredientNames}
          </p>
        </div>
        {safetyLevel ? (
          <SafetyBadge
            level={safetyLevel === "safe" ? "SAFE" : safetyLevel === "moderate" ? "MODERATE" : "TOXIC"}
          />
        ) : (
          <span className="whitespace-nowrap rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-txt-tertiary">
            {t("notAnalyzed")}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {petName && (
          <span className="flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-xs text-txt-secondary">
            <Clock className="h-3 w-3" />
            {petName}
          </span>
        )}
        <span className="rounded-md bg-canvas px-2 py-1 text-xs text-txt-secondary">
          {t("ingredientCount", { count: recipe.recipe_ingredients.length })}
        </span>
        {alertCount > 0 && (
          <span className="flex items-center gap-1 rounded-md bg-error/10 px-2 py-1 text-xs text-error">
            <AlertTriangle className="h-3 w-3" />
            {t("alertCount", { count: alertCount })}
          </span>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Create RecipeForm component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IngredientList } from "./ingredient-list";
import { usePetStore } from "@/store/pet-store";
import type { RecipeFormValues, IngredientFormValues } from "@/lib/validators";
import { recipeFormSchema } from "@/lib/validators";
import { Search } from "lucide-react";

interface RecipeFormProps {
  initialValues?: RecipeFormValues;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  onAnalyze?: () => void;
  showAnalyze?: boolean;
  isSubmitting?: boolean;
}

export function RecipeForm({
  initialValues,
  onSubmit,
  onAnalyze,
  showAnalyze = false,
  isSubmitting = false,
}: RecipeFormProps) {
  const t = useTranslations();
  const { pets } = usePetStore();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [petId, setPetId] = useState<string | null>(
    initialValues?.pet_id ?? null,
  );
  const [ingredients, setIngredients] = useState<IngredientFormValues[]>(
    initialValues?.ingredients ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const values: RecipeFormValues = {
      name,
      pet_id: petId,
      ingredients,
    };
    const result = recipeFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <div className="space-y-5">
      {/* Recipe name */}
      <div>
        <Input
          label={t("recipeName")}
          placeholder={t("recipeNamePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name ? t("recipeNameRequired") : undefined}
        />
      </div>

      {/* Pet selector */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-txt-secondary">
          {t("forWhichPet")}
        </label>
        <div className="flex flex-wrap gap-2">
          {pets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-1.5 rounded-[10px] border px-4 text-sm font-medium transition-colors duration-150 ${
                petId === pet.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-txt-secondary"
              }`}
              onClick={() => setPetId(pet.id)}
            >
              {pet.name}
            </button>
          ))}
          <button
            type="button"
            className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center rounded-[10px] border border-dashed px-4 text-sm font-medium transition-colors duration-150 ${
              petId === null
                ? "border-primary bg-primary text-white"
                : "border-border-secondary text-txt-secondary"
            }`}
            onClick={() => setPetId(null)}
          >
            {t("nonePet")}
          </button>
        </div>
      </div>

      {/* Ingredients */}
      <IngredientList
        ingredients={ingredients}
        onChange={(updated) => {
          setIngredients(updated);
          if (errors.ingredients)
            setErrors((prev) => ({ ...prev, ingredients: "" }));
        }}
        error={
          errors.ingredients ? t("addAtLeastOneIngredient") : undefined
        }
      />

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button fullWidth isLoading={isSubmitting} onClick={handleSave}>
          {t("saveRecipe")}
        </Button>
        {showAnalyze && onAnalyze && (
          <Button fullWidth variant="secondary" onClick={onAnalyze}>
            <Search className="mr-2 h-[18px] w-[18px]" />
            {t("analyzeRecipe")}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/recipe/
git commit -m "feat: add recipe UI components (form, ingredient list, preparation chips, card)"
```

---

## Task 8: Recipe Pages (List, Create, Edit)

**Files:**
- Create: `src/app/(app)/recipes/page.tsx`
- Create: `src/app/(app)/recipes/new/page.tsx`
- Create: `src/app/(app)/recipes/edit/page.tsx`

- [ ] **Step 1: Create recipe list page**

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { useRecipes } from "@/hooks/use-recipes";
import { usePetStore } from "@/store/pet-store";

export default function RecipesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { recipes, isLoading, analyses, fetchRecipes } = useRecipes();
  const { pets } = usePetStore();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const getPetName = (petId: string | null) =>
    pets.find((p) => p.id === petId)?.name;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-1.5 text-[17px] font-semibold text-txt">
          {t("noRecipesYet")}
        </p>
        <p className="mb-6 text-sm leading-relaxed text-txt-secondary">
          {t("noRecipesDescription")}
        </p>
        <Button onClick={() => router.push("/recipes/new")}>
          <Plus className="mr-2 h-[18px] w-[18px]" />
          {t("newRecipe")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-txt">{t("myRecipes")}</h1>
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            analysis={analyses[recipe.id]}
            petName={getPetName(recipe.pet_id)}
          />
        ))}
      </div>
      <div className="mt-4">
        <Button fullWidth onClick={() => router.push("/recipes/new")}>
          <Plus className="mr-2 h-[18px] w-[18px]" />
          {t("newRecipe")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create new recipe page**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { useRecipes } from "@/hooks/use-recipes";
import type { RecipeFormValues } from "@/lib/validators";

export default function NewRecipePage() {
  const t = useTranslations();
  const router = useRouter();
  const { createRecipe } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: RecipeFormValues) => {
    setIsSubmitting(true);
    try {
      const recipe = await createRecipe(values);
      router.replace(`/recipes/edit?id=${recipe.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 text-txt-secondary" />
        </button>
        <h1 className="text-[17px] font-bold text-txt">{t("newRecipe")}</h1>
      </div>
      <div className="p-4">
        <RecipeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create edit recipe page**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Trash2 } from "lucide-react";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes } from "@/hooks/use-recipes";
import { useAuthStore } from "@/store/auth-store";
import { useRecipeStore } from "@/store/recipe-store";
import type { RecipeFormValues } from "@/lib/validators";

export default function EditRecipePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { editRecipe, deleteRecipe } = useRecipes();
  const { subscriptionTier } = useAuthStore();
  const recipes = useRecipeStore((s) => s.recipes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipe = recipes.find((r) => r.id === recipeId);

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!recipeId) return;
    setIsSubmitting(true);
    try {
      await editRecipe(recipeId, values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = () => {
    if (subscriptionTier !== "PREMIUM") {
      // Show upgrade prompt (handled by access gate in layout)
      return;
    }
    router.push(`/recipes/analysis?id=${recipeId}`);
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    if (!confirm(t("deleteRecipeConfirm"))) return;
    await deleteRecipe(recipeId);
    router.replace("/recipes");
  };

  if (!recipe) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const initialValues: RecipeFormValues = {
    name: recipe.name,
    pet_id: recipe.pet_id,
    ingredients: recipe.recipe_ingredients
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ name: i.name, preparation: i.preparation })),
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <button
            className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5 text-txt-secondary" />
          </button>
          <h1 className="text-[17px] font-bold text-txt">
            {t("editRecipe")}
          </h1>
        </div>
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center text-error"
          onClick={handleDelete}
          aria-label={t("deleteRecipe")}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <RecipeForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onAnalyze={handleAnalyze}
          showAnalyze={recipe.recipe_ingredients.length > 0}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds, new routes exist in `out/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/recipes/
git commit -m "feat: add recipe list, create, and edit pages"
```

---

## Task 9: Agent Tools

**Files:**
- Create: `src/lib/agent/tools/lookup-food.ts`
- Create: `src/lib/agent/tools/get-pet-profile.ts`

- [ ] **Step 1: Create lookup_food tool**

```typescript
import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createClient } from "@supabase/supabase-js";

const LookupFoodParams = Type.Object({
  query: Type.String({ description: "The ingredient name to look up in the food safety database" }),
});

type LookupFoodParams = Static<typeof LookupFoodParams>;

interface FoodRow {
  id: string;
  name_tr: string;
  category_tr: string;
  safety_level: string;
  dangerous_parts: string | null;
  preparation: string | null;
  benefits: string | null;
  warnings: string | null;
}

export function createLookupFoodTool(
  supabaseUrl: string,
  supabaseKey: string,
): AgentTool<typeof LookupFoodParams, FoodRow | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    name: "lookup_food",
    label: "Lookup Food",
    description:
      "Search the dog food safety database for an ingredient. Returns safety level, dangerous parts, preparation requirements, benefits, and warnings. Use this for every ingredient in the recipe.",
    parameters: LookupFoodParams,
    execute: async (toolCallId, { query }) => {
      const { data, error } = await supabase.rpc("search_foods", {
        search_query: query,
      });

      if (error || !data || data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No match found in the food safety database for "${query}". Use your own knowledge to assess this ingredient.`,
            },
          ],
          details: null,
        };
      }

      const food = data[0] as FoodRow;
      const summary = [
        `Food: ${food.name_tr}`,
        `Category: ${food.category_tr}`,
        `Safety: ${food.safety_level}`,
        food.dangerous_parts
          ? `Dangerous parts: ${food.dangerous_parts}`
          : null,
        food.preparation ? `Preparation: ${food.preparation}` : null,
        food.benefits ? `Benefits: ${food.benefits}` : null,
        food.warnings ? `Warnings: ${food.warnings}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: food,
      };
    },
  };
}
```

- [ ] **Step 2: Create get_pet_profile tool**

```typescript
import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createClient } from "@supabase/supabase-js";

const GetPetProfileParams = Type.Object({
  pet_id: Type.String({ description: "The UUID of the pet to fetch" }),
});

type GetPetProfileParams = Static<typeof GetPetProfileParams>;

interface PetProfile {
  id: string;
  name: string;
  breed: string | null;
  age_months: number | null;
  weight_kg: number | null;
  gender: string | null;
  is_neutered: boolean;
  body_condition_score: number | null;
  activity_level: string;
}

export function createGetPetProfileTool(
  supabaseUrl: string,
  supabaseKey: string,
): AgentTool<typeof GetPetProfileParams, PetProfile | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    name: "get_pet_profile",
    label: "Get Pet Profile",
    description:
      "Fetch a dog's profile including breed, weight, age, activity level, and body condition score. Use this to personalize dietary advice.",
    parameters: GetPetProfileParams,
    execute: async (toolCallId, { pet_id }) => {
      const { data, error } = await supabase
        .from("pets")
        .select(
          "id, name, breed, age_months, weight_kg, gender, is_neutered, body_condition_score, activity_level",
        )
        .eq("id", pet_id)
        .single();

      if (error || !data) {
        return {
          content: [
            { type: "text", text: "Could not fetch pet profile. Provide general advice." },
          ],
          details: null,
        };
      }

      const pet = data as PetProfile;
      const ageYears = pet.age_months ? (pet.age_months / 12).toFixed(1) : "unknown";
      const summary = [
        `Dog: ${pet.name}`,
        `Breed: ${pet.breed ?? "unknown"}`,
        `Age: ${ageYears} years (${pet.age_months ?? "?"} months)`,
        `Weight: ${pet.weight_kg ?? "unknown"} kg`,
        `Gender: ${pet.gender ?? "unknown"}, ${pet.is_neutered ? "neutered" : "intact"}`,
        `Body Condition Score: ${pet.body_condition_score ?? "unknown"}/9`,
        `Activity Level: ${pet.activity_level}`,
      ].join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: pet,
      };
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agent/
git commit -m "feat: add lookup_food and get_pet_profile agent tools"
```

---

## Task 10: Agent Factory & System Prompt

**Files:**
- Create: `src/lib/agent/system-prompt.ts`
- Create: `src/lib/agent/create-agent.ts`

- [ ] **Step 1: Create system prompt builder**

```typescript
export function buildSystemPrompt(locale: string): string {
  const lang = locale === "tr" ? "Turkish" : "English";

  return `You are an expert canine nutritionist AI assistant for the PawBalance app. Your role is to analyze dog food recipes for safety, nutritional value, and suitability.

## Instructions

1. For EVERY ingredient in the recipe, call the lookup_food tool to check it against the safety database.
2. If a pet_id is provided, call the get_pet_profile tool to personalize your advice.
3. After gathering all information, produce your analysis.

## Output Format

You MUST respond with a single JSON object (no markdown, no code fences, no explanation outside the JSON). The schema:

{
  "overall_safety": "safe" | "moderate" | "toxic",
  "ingredients": [
    {
      "name": "ingredient name as provided by the user",
      "safety_level": "safe" | "moderate" | "toxic",
      "preparation_ok": true | false,
      "notes": "Brief note about this ingredient (1 sentence)"
    }
  ],
  "safety_alerts": ["Array of critical safety warnings — ONLY if toxic or dangerous ingredients are present"],
  "preparation_warnings": ["Array of preparation-related advice"],
  "benefits_summary": ["Array of nutritional benefits of this recipe"],
  "suggestions": ["Array of improvement suggestions"],
  "follow_up_actions": [
    {
      "type": "recipe_edit",
      "label": "Human-readable action label",
      "ingredient_id": "UUID of the ingredient to replace",
      "new_name": "Replacement ingredient name",
      "new_preparation": "Recommended preparation method"
    },
    {
      "type": "detail_card",
      "label": "Human-readable card title",
      "icon": "pill" | "heart" | "alert" | "lightbulb" | "shield",
      "detail": "Detailed advice text (2-4 sentences, personalized to the dog if profile available)"
    }
  ]
}

## Rules

- overall_safety is "toxic" if ANY ingredient is toxic, "moderate" if any is moderate, "safe" only if ALL are safe.
- preparation_ok is false if the user's stated preparation method is unsafe for that ingredient.
- Generate 2-5 follow_up_actions. Prioritize:
  1. recipe_edit actions for toxic/moderate ingredients (suggest safe replacements)
  2. recipe_edit actions for incorrect preparation methods
  3. detail_card with icon "pill" for supplement recommendations (especially calcium, omega-3)
  4. detail_card with icon "heart" for breed-specific health advice (if pet profile available)
  5. detail_card with icon "alert" for emergency guidance if toxic ingredients are present
  6. detail_card with icon "lightbulb" for general improvement suggestions
- All text in the JSON MUST be in ${lang}.
- Keep notes and details concise but actionable.
- If an ingredient is not in the database, use your own veterinary nutrition knowledge to assess it. Be conservative — if unsure, mark as "moderate".`;
}
```

- [ ] **Step 2: Create agent factory**

```typescript
import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, streamSimple } from "@mariozechner/pi-ai";
import { createLookupFoodTool } from "./tools/lookup-food";
import { createGetPetProfileTool } from "./tools/get-pet-profile";
import { buildSystemPrompt } from "./system-prompt";

interface CreateRecipeAgentOptions {
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
}

export function createRecipeAgent({
  locale,
  supabaseUrl,
  supabaseKey,
  anthropicApiKey,
}: CreateRecipeAgentOptions): Agent {
  const model = getModel("anthropic", "claude-sonnet-4-20250514");

  const lookupFood = createLookupFoodTool(supabaseUrl, supabaseKey);
  const getPetProfile = createGetPetProfileTool(supabaseUrl, supabaseKey);

  return new Agent({
    initialState: {
      systemPrompt: buildSystemPrompt(locale),
      model,
      tools: [lookupFood, getPetProfile],
    },
    streamFn: streamSimple,
    getApiKey: async (provider) => {
      if (provider === "anthropic") return anthropicApiKey;
      return undefined;
    },
    toolExecution: "parallel",
    afterToolCall: async (context) => {
      // Log for analytics (can be extended later)
      console.log(
        `[agent] Tool ${context.toolCall.name} called with args:`,
        context.args,
        `isError: ${context.isError}`,
      );
      return undefined;
    },
  });
}
```

- [ ] **Step 3: Verify build (server mode)**

```bash
npm run build:server
```

Expected: Build succeeds. The agent code is included in the server bundle.

- [ ] **Step 4: Commit**

```bash
git add src/lib/agent/
git commit -m "feat: add agent factory with system prompt and tool configuration"
```

---

## Task 11: API Route Handler

**Files:**
- Create: `src/app/api/recipes/analyze/route.ts`

- [ ] **Step 1: Create the POST route handler with SSE streaming**

```typescript
import { createClient } from "@supabase/supabase-js";
import { createRecipeAgent } from "@/lib/agent/create-agent";
import type { RecipeIngredient, AnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  // 1. Parse request
  const { recipeId, petId, locale } = await request.json();
  if (!recipeId) {
    return Response.json({ error: "recipeId is required" }, { status: 400 });
  }

  // 2. Validate auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 3. Verify user owns the recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", recipeId)
    .single();

  if (recipeError || !recipe) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const ingredients = (recipe.recipe_ingredients as RecipeIngredient[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  // 4. Create pending analysis record
  const { data: analysis, error: analysisError } = await supabase
    .from("recipe_analyses")
    .insert({
      recipe_id: recipeId,
      pet_id: petId || null,
      status: "pending",
    })
    .select()
    .single();

  if (analysisError) {
    return Response.json({ error: "Failed to create analysis" }, { status: 500 });
  }

  // 5. Build user message with recipe data
  const ingredientList = ingredients
    .map((i, idx) => `${idx + 1}. ${i.name} — Preparation: ${i.preparation} (ingredient_id: ${i.id})`)
    .join("\n");

  const userMessage = `Analyze this dog food recipe:

Recipe: "${recipe.name}"
${petId ? `Pet ID: ${petId}` : "No specific pet selected."}

Ingredients:
${ingredientList}

Look up each ingredient in the safety database and provide your analysis.`;

  // 6. Create agent and stream response
  const agent = createRecipeAgent({
    locale: locale || "en",
    supabaseUrl,
    supabaseKey,
    anthropicApiKey,
  });

  // 7. SSE streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      // Send ingredient list for progress tracking
      send("ingredients", ingredients.map((i) => ({ id: i.id, name: i.name })));

      // Subscribe to agent events
      agent.subscribe((event) => {
        if (event.type === "tool_execution_start") {
          send("tool_start", {
            toolName: event.toolName,
            args: event.args,
          });
        }
        if (event.type === "tool_execution_end") {
          send("tool_end", {
            toolName: event.toolName,
            isError: event.isError,
            result: event.result,
          });
        }
      });

      try {
        await agent.prompt(userMessage);

        // Extract the final assistant message text
        const messages = agent.state.messages;
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        let resultJson: AnalysisResult | null = null;
        if (lastAssistant && "content" in lastAssistant) {
          const textContent = (lastAssistant.content as any[]).find(
            (c: any) => c.type === "text",
          );
          if (textContent) {
            try {
              // Strip markdown code fences if present
              let text = textContent.text.trim();
              if (text.startsWith("```")) {
                text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
              }
              resultJson = JSON.parse(text);
            } catch {
              // Model didn't return valid JSON
            }
          }
        }

        if (resultJson) {
          // Save completed analysis
          await supabase
            .from("recipe_analyses")
            .update({
              status: "completed",
              result: resultJson,
              model_used: "claude-sonnet-4-20250514",
            })
            .eq("id", analysis.id);

          send("result", resultJson);
        } else {
          await supabase
            .from("recipe_analyses")
            .update({ status: "failed" })
            .eq("id", analysis.id);

          send("error", { message: "Agent did not return valid JSON" });
        }
      } catch (err) {
        await supabase
          .from("recipe_analyses")
          .update({ status: "failed" })
          .eq("id", analysis.id);

        send("error", {
          message: err instanceof Error ? err.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Verify server build**

```bash
npm run build:server
```

Expected: Build succeeds with the API route included.

- [ ] **Step 3: Also verify static build still works**

```bash
npm run build:static
```

Expected: Build succeeds. The POST-only route handler is silently skipped.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add POST /api/recipes/analyze route with SSE streaming"
```

---

## Task 12: Analysis Client Hook

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/hooks/use-recipe-analysis.ts`

- [ ] **Step 1: Create API helper**

```typescript
export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}${path}`;
}
```

- [ ] **Step 2: Create analysis hook with SSE client**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts src/hooks/use-recipe-analysis.ts
git commit -m "feat: add analysis SSE client hook and API helper"
```

---

## Task 13: Analysis UI Components

**Files:**
- Create: `src/components/recipe/analysis-progress.tsx`
- Create: `src/components/recipe/analysis-report.tsx`
- Create: `src/components/recipe/follow-up-actions.tsx`

- [ ] **Step 1: Create AnalysisProgress component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IngredientProgress } from "@/hooks/use-recipe-analysis";

interface AnalysisProgressProps {
  recipeName: string;
  ingredients: IngredientProgress[];
}

export function AnalysisProgress({
  recipeName,
  ingredients,
}: AnalysisProgressProps) {
  const t = useTranslations();

  return (
    <div>
      <div className="py-5 text-center">
        <Loader2 className="mx-auto mb-3.5 h-12 w-12 animate-spin text-primary" />
        <p className="font-semibold text-txt">
          {t("analyzingRecipe", { recipeName })}
        </p>
        <p className="text-[13px] text-txt-secondary">
          {t("checkingIngredients", { count: ingredients.length })}
        </p>
      </div>

      <Card>
        {ingredients.map((ing, i) => (
          <div
            key={ing.id}
            className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
              i < ingredients.length - 1 ? "border-b border-border" : ""
            }`}
          >
            {ing.status === "done" && (
              <Check className="h-[18px] w-[18px] flex-shrink-0 text-safe" />
            )}
            {ing.status === "checking" && (
              <Loader2 className="h-[18px] w-[18px] flex-shrink-0 animate-spin text-primary" />
            )}
            {ing.status === "pending" && (
              <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-border" />
              </div>
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  ing.status === "pending" ? "text-txt-tertiary" : "text-txt"
                }`}
              >
                {ing.name}
              </p>
              <p className="text-xs text-txt-secondary">
                {ing.status === "done" && ing.safety
                  ? ing.safety.charAt(0).toUpperCase() + ing.safety.slice(1)
                  : ing.status === "checking"
                    ? t("ingredientChecking")
                    : t("ingredientPending")}
              </p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-4 space-y-3">
        <Skeleton className="h-3.5 w-[120px]" />
        <Skeleton className="h-[60px] w-full rounded-xl" />
        <Skeleton className="h-3.5 w-[90px]" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AnalysisReport component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import {
  ShieldAlert,
  Tag,
  CheckCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AnalysisResult, AnalysisSafety } from "@/lib/types";

const SAFETY_CONFIG: Record<
  AnalysisSafety,
  { bg: string; border: string; text: string; icon: typeof ShieldAlert; label: string }
> = {
  safe: {
    bg: "bg-safe/10",
    border: "border-safe/25",
    text: "text-safe",
    icon: CheckCircle,
    label: "safe",
  },
  moderate: {
    bg: "bg-caution/10",
    border: "border-caution/25",
    text: "text-caution",
    icon: AlertTriangle,
    label: "caution",
  },
  toxic: {
    bg: "bg-toxic/10",
    border: "border-toxic/25",
    text: "text-toxic",
    icon: ShieldAlert,
    label: "toxic",
  },
};

const DOT_COLORS: Record<AnalysisSafety, string> = {
  safe: "bg-safe",
  moderate: "bg-caution",
  toxic: "bg-toxic",
};

interface AnalysisReportProps {
  result: AnalysisResult;
}

export function AnalysisReport({ result }: AnalysisReportProps) {
  const t = useTranslations();
  const config = SAFETY_CONFIG[result.overall_safety];
  const Icon = config.icon;

  return (
    <div>
      {/* Overall safety banner */}
      <div
        className={`mb-4 rounded-[14px] border p-4 text-center ${config.bg} ${config.border}`}
      >
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <Icon className={`h-4 w-4 ${config.text}`} />
          <p
            className={`text-sm font-bold uppercase tracking-wide ${config.text}`}
          >
            {t(config.label)}
          </p>
        </div>
        {result.safety_alerts.length > 0 && (
          <p className="text-[13px] text-txt-secondary">
            {result.safety_alerts.length} alert
            {result.safety_alerts.length > 1 ? "s" : ""}
            {result.preparation_warnings.length > 0 &&
              `, ${result.preparation_warnings.length} preparation warning${result.preparation_warnings.length > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Ingredients breakdown */}
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-txt-secondary">
        {t("ingredients")}
      </p>
      <Card className="mb-4">
        {result.ingredients.map((ing, i) => (
          <div
            key={i}
            className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
              ing.safety_level === "toxic" ? "bg-toxic/5" : ""
            } ${i < result.ingredients.length - 1 ? "border-b border-border" : ""}`}
          >
            <div
              className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_COLORS[ing.safety_level]}`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-txt">{ing.name}</p>
              <p
                className={`text-xs ${
                  ing.safety_level === "safe"
                    ? "text-safe"
                    : ing.safety_level === "moderate"
                      ? "text-caution"
                      : "text-toxic"
                }`}
              >
                {ing.notes}
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* Safety Alerts */}
      {result.safety_alerts.length > 0 && (
        <div className="mb-3 rounded-xl border border-toxic/20 bg-toxic/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-toxic">
            <ShieldAlert className="h-4 w-4" />
            {t("safetyAlerts")}
          </p>
          {result.safety_alerts.map((alert, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-txt">
              {alert}
            </p>
          ))}
        </div>
      )}

      {/* Preparation Warnings */}
      {result.preparation_warnings.length > 0 && (
        <div className="mb-3 rounded-xl border border-caution/20 bg-caution/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-caution">
            <Tag className="h-4 w-4" />
            {t("preparationTips")}
          </p>
          {result.preparation_warnings.map((warning, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-txt">
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Benefits */}
      {result.benefits_summary.length > 0 && (
        <div className="mb-3 rounded-xl border border-safe/20 bg-safe/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-safe">
            <CheckCircle className="h-4 w-4" />
            {t("benefitsSummary")}
          </p>
          <ul className="list-inside list-disc text-[13px] leading-relaxed text-txt">
            {result.benefits_summary.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="mb-3 rounded-xl border border-border bg-surface p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
            <Lightbulb className="h-4 w-4" />
            {t("suggestionsSummary")}
          </p>
          <ul className="list-inside list-disc text-[13px] leading-relaxed text-txt">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create FollowUpActions component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRightLeft,
  Pill,
  Heart,
  AlertTriangle,
  Lightbulb,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type {
  FollowUpAction,
  RecipeEditAction,
  DetailCardAction,
  DetailCardIcon,
} from "@/lib/types";

const ICON_MAP: Record<DetailCardIcon, typeof Pill> = {
  pill: Pill,
  heart: Heart,
  alert: AlertTriangle,
  lightbulb: Lightbulb,
  shield: Shield,
};

interface FollowUpActionsProps {
  actions: FollowUpAction[];
  onRecipeEdit: (action: RecipeEditAction) => void;
}

export function FollowUpActions({
  actions,
  onRecipeEdit,
}: FollowUpActionsProps) {
  const t = useTranslations();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const recipeEdits = actions.filter(
    (a): a is RecipeEditAction => a.type === "recipe_edit",
  );
  const detailCards = actions.filter(
    (a): a is DetailCardAction => a.type === "detail_card",
  );

  return (
    <div className="space-y-2">
      {/* Recipe edit actions */}
      {recipeEdits.map((action, i) => (
        <button
          key={`edit-${i}`}
          className="flex w-full cursor-pointer touch-manipulation items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left transition-colors active:bg-primary/10"
          onClick={() => onRecipeEdit(action)}
        >
          <ArrowRightLeft className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-[13px] font-medium text-txt">{action.label}</p>
        </button>
      ))}

      {/* Detail cards */}
      {detailCards.map((action, i) => {
        const Icon = ICON_MAP[action.icon];
        const globalIndex = recipeEdits.length + i;
        const isExpanded = expandedIndex === globalIndex;

        return (
          <button
            key={`detail-${i}`}
            className="w-full cursor-pointer touch-manipulation rounded-xl border border-border bg-surface p-3.5 text-left transition-colors active:bg-canvas"
            onClick={() =>
              setExpandedIndex(isExpanded ? null : globalIndex)
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 flex-shrink-0 text-txt-secondary" />
              <p className="flex-1 text-[13px] font-medium text-txt">
                {action.label}
              </p>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-txt-tertiary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-txt-tertiary" />
              )}
            </div>
            {isExpanded && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-[13px] leading-relaxed text-txt-secondary">
                  {action.detail}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/recipe/analysis-progress.tsx src/components/recipe/analysis-report.tsx src/components/recipe/follow-up-actions.tsx
git commit -m "feat: add analysis progress, report, and follow-up action components"
```

---

## Task 14: Analysis Page

**Files:**
- Create: `src/app/(app)/recipes/analysis/page.tsx`

- [ ] **Step 1: Create the analysis page**

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, XCircle, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisProgress } from "@/components/recipe/analysis-progress";
import { AnalysisReport } from "@/components/recipe/analysis-report";
import { FollowUpActions } from "@/components/recipe/follow-up-actions";
import { useRecipeAnalysis } from "@/hooks/use-recipe-analysis";
import { useRecipeStore } from "@/store/recipe-store";
import { useRecipes } from "@/hooks/use-recipes";
import { useLocale } from "@/hooks/use-locale";
import type { RecipeEditAction } from "@/lib/types";

export default function AnalysisPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { locale } = useLocale();
  const { applyIngredientSwap } = useRecipes();

  const recipes = useRecipeStore((s) => s.recipes);
  const recipe = recipes.find((r) => r.id === recipeId);
  const storedAnalysis = useRecipeStore((s) =>
    recipeId ? s.analyses[recipeId] : undefined,
  );

  const { status, ingredientProgress, result, error, analyze } =
    useRecipeAnalysis();

  // Auto-start analysis on mount (if no completed analysis exists)
  useEffect(() => {
    if (recipeId && recipe && status === "idle" && !storedAnalysis?.result) {
      analyze(recipeId, recipe.pet_id, locale);
    }
  }, [recipeId, recipe, status, storedAnalysis, analyze, locale]);

  const handleRetry = () => {
    if (recipeId && recipe) {
      analyze(recipeId, recipe.pet_id, locale);
    }
  };

  const handleRecipeEdit = async (action: RecipeEditAction) => {
    if (!recipeId) return;
    await applyIngredientSwap(
      recipeId,
      action.ingredient_id,
      action.new_name,
      action.new_preparation,
    );
    // Re-analyze with updated recipe
    const updatedRecipe = useRecipeStore
      .getState()
      .recipes.find((r) => r.id === recipeId);
    if (updatedRecipe) {
      analyze(recipeId, updatedRecipe.pet_id, locale);
    }
  };

  // Use stored result if available and we haven't started a new analysis
  const displayResult = result ?? storedAnalysis?.result ?? null;
  const displayStatus =
    status !== "idle" ? status : storedAnalysis?.result ? "completed" : "idle";

  return (
    <div>
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 text-txt-secondary" />
        </button>
        <h1 className="text-[17px] font-bold text-txt">
          {t("recipeAnalysis")}
        </h1>
      </div>

      <div className="p-4">
        {/* Streaming progress */}
        {displayStatus === "pending" && recipe && (
          <AnalysisProgress
            recipeName={recipe.name}
            ingredients={ingredientProgress}
          />
        )}

        {/* Error state */}
        {displayStatus === "failed" && (
          <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-toxic/10">
              <XCircle className="h-7 w-7 text-toxic" />
            </div>
            <p className="mb-1.5 text-base font-semibold text-txt">
              {t("analysisFailed")}
            </p>
            <p className="mb-6 text-sm text-txt-secondary">
              {error ?? t("analysisFailedDescription")}
            </p>
            <Button onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
        )}

        {/* Completed report */}
        {displayStatus === "completed" && displayResult && (
          <>
            <AnalysisReport result={displayResult} />

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
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/recipes/analysis/
git commit -m "feat: add recipe analysis page with streaming, report, and follow-up actions"
```

---

## Task 15: Final Verification & Cleanup

**Files:**
- Various (verification only)

- [ ] **Step 1: Verify static build (Capacitor)**

```bash
npm run build:static
```

Expected: Build succeeds. All new routes (recipes, recipes/new, recipes/edit, recipes/analysis) appear in `out/`. API route is NOT in `out/`.

- [ ] **Step 2: Verify server build (K8s)**

```bash
npm run build:server
```

Expected: Build succeeds. API route at `/api/recipes/analyze` is included in the `.next` output.

- [ ] **Step 3: Check for lint errors**

```bash
npm run lint
```

Fix any lint errors that appear.

- [ ] **Step 4: Verify all new i18n keys exist in both locales**

Check that every key added to `en.json` has a corresponding key in `tr.json`. Missing keys will cause runtime errors with next-intl.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint errors and i18n completeness"
```

---

## Execution Notes

### Environment Variables Required

Before running the server build locally, add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For Capacitor builds, `NEXT_PUBLIC_API_URL` should point to the K8s-hosted URL:
```
NEXT_PUBLIC_API_URL=https://app.pawbalance.com
```

### Supabase Migration

Task 3 must be completed BEFORE testing Tasks 6-14. The migration SQL must be run in the Supabase SQL Editor since the project doesn't use a local migration framework.

### pi-agent-core Package Resolution

If `@mariozechner/pi-agent-core` and `@mariozechner/pi-ai` are not published to npm, install from the local monorepo:
```bash
npm install ./refs/pi-mono/packages/agent ./refs/pi-mono/packages/ai
```

And ensure `@sinclair/typebox` is installed as a peer dependency.

### Testing the Full Flow

After all tasks are complete, test the end-to-end flow:
1. Start the server: `BUILD_MODE=server npm run dev`
2. Create a recipe with 2-3 ingredients
3. Tap "Analyze Recipe"
4. Verify SSE streaming shows ingredient-by-ingredient progress
5. Verify the analysis report renders correctly
6. Tap a recipe_edit follow-up action and verify re-analysis triggers
7. Tap a detail_card and verify it expands
