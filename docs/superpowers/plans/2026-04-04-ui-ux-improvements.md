# UI/UX Audit Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 19 UI/UX issues identified in the PawBalance audit — 4 screen redesigns + 15 targeted fixes.

**Architecture:** All changes are client-side UI modifications to existing Next.js pages and components. Two new components are created (`EmptyState`, `AddToRecipeSheet`). No backend/API changes. All new text gets i18n keys in both EN and TR.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS 4, Lucide React icons, next-intl, Zustand stores

**Spec:** `docs/superpowers/specs/2026-04-04-ui-ux-audit-improvements-design.md`

---

## File Structure

### New Files
- `src/components/ui/empty-state.tsx` — Reusable empty state with icon, title, subtitle, action
- `src/components/food/add-to-recipe-sheet.tsx` — Bottom sheet for adding food to recipe from food detail

### Modified Files
- `src/components/ui/icon.tsx` — Add new Lucide icon exports
- `src/lib/constants.ts` — Replace emoji `CATEGORY_ICONS` with SVG icon + color mapping
- `src/components/food/category-grid.tsx` — SVG icons, rounded squares, food count
- `src/components/food/food-card.tsx` — Safety icon on accent bar
- `src/app/welcome/page.tsx` — Layout fix, benefit cards, CTA arrow
- `src/app/(app)/scan/page.tsx` — Viewfinder preview, how-it-works, upgrade CTA
- `src/app/(app)/search/food/page.tsx` — Add action bar with "Add to Recipe" + share
- `src/app/(app)/search/page.tsx` — Empty state for no-results, grammar fix
- `src/app/(app)/profile/page.tsx` — Menu grouping, sign-out confirmation
- `src/app/(app)/learn/page.tsx` — Tag chip scroll affordance
- `src/components/recipe/analysis-report.tsx` — Actionable suggestions with "+ Add"
- `src/components/pet/pet-card.tsx` — Touch target sizes on edit/delete
- `src/components/auth/SocialLoginButtons.tsx` — Google brand icon
- `src/app/(auth)/login/page.tsx` — Placeholder text
- `src/app/(auth)/register/page.tsx` — Placeholder text
- `src/messages/en.json` — New i18n keys
- `src/messages/tr.json` — Turkish translations

---

## Task 1: Add New Icons to Icon Registry

**Files:**
- Modify: `src/components/ui/icon.tsx`

- [ ] **Step 1: Add new Lucide imports**

Add these imports to the import block at line 1:

```tsx
import {
  // ... existing imports ...
  Apple,
  Beef,
  Bone,
  Carrot,
  ChefHat,
  Citrus,
  Egg,
  Fish,
  FlaskRound,
  Leaf,
  Milk,
  Nut,
  Plus,
  SearchX,
  Share2,
  Sprout,
  Wheat,
  HeartPulse,
  Cloud,
  Salad,
  Layers,
  Lock,
} from "lucide-react";
```

- [ ] **Step 2: Add new icon entries to the Icons object**

Add these entries inside the `Icons` object:

```tsx
// Category icons
citrus: Citrus,
carrot: Carrot,
bone: Bone,
milk: Milk,
egg: Egg,
flaskRound: FlaskRound,
fish: Fish,
apple: Apple,
wheat: Wheat,
beef: Beef,
leaf: Leaf,
cloud: Cloud,
nut: Nut,
heartPulse: HeartPulse,
salad: Salad,
sprout: Sprout,

// Actions
plus: Plus,
share: Share2,
searchX: SearchX,
chefHat: ChefHat,
layers: Layers,
lock: Lock,
```

- [ ] **Step 3: Verify build**

Run: `npm run build:static 2>&1 | head -20`
Expected: No TypeScript errors related to icon imports.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/icon.tsx
git commit -m "feat: add Lucide icons for category grid, actions, and empty states"
```

---

## Task 2: Add Category Icon + Color Mapping to Constants

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Replace CATEGORY_ICONS with new mapping**

Replace lines 5-32 in `src/lib/constants.ts` (the entire `CATEGORY_ICONS` record and `getCategoryIcon` function through line 37) with:

```tsx
import type { IconName } from "@/components/ui/icon";

export interface CategoryStyle {
  icon: IconName;
  bg: string; // Tailwind bg class for the icon container
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Asian Fruit":          { icon: "citrus",     bg: "bg-[#FFF3E0]" },
  "Asian Herb":           { icon: "sprout",     bg: "bg-[#D1FAE5]" },
  "Asian Vegetable":      { icon: "carrot",     bg: "bg-[#FFF8E1]" },
  Spice:                  { icon: "flaskRound", bg: "bg-[#FDF2F8]" },
  Fish:                   { icon: "fish",       bg: "bg-[#E0F2FE]" },
  Seafood:                { icon: "fish",       bg: "bg-[#E0F2FE]" },
  Meat:                   { icon: "beef",       bg: "bg-[#FEE2E2]" },
  "Fermented Food":       { icon: "flaskRound", bg: "bg-[#FDF2F8]" },
  "Prepared Food & Sauce":{ icon: "chefHat",    bg: "bg-[#FFF8E1]" },
  Bone:                   { icon: "bone",       bg: "bg-[#F3E8FF]" },
  Nuts:                   { icon: "nut",        bg: "bg-[#FED7AA]" },
  Mushroom:               { icon: "cloud",      bg: "bg-[#F1F5F9]" },
  Fruit:                  { icon: "apple",      bg: "bg-[#DCFCE7]" },
  Organ:                  { icon: "heartPulse", bg: "bg-[#FCE7F3]" },
  Vegetable:              { icon: "salad",      bg: "bg-[#ECFCCB]" },
  Dairy:                  { icon: "milk",       bg: "bg-[#EDE9FE]" },
  "Medicinal Herb":       { icon: "leaf",       bg: "bg-[#D1FAE5]" },
  Grain:                  { icon: "wheat",      bg: "bg-[#FEF9C3]" },
  "Pseudo-grain":         { icon: "wheat",      bg: "bg-[#FEF9C3]" },
  Sweetener:              { icon: "flaskRound", bg: "bg-[#FEF3C7]" },
  Seed:                   { icon: "sprout",     bg: "bg-[#ECFCCB]" },
  "Tropical Product":     { icon: "citrus",     bg: "bg-[#FFF3E0]" },
  "Tropical Oil":         { icon: "leaf",       bg: "bg-[#FFF3E0]" },
  "Salt & Mineral":       { icon: "flaskRound", bg: "bg-[#F1F5F9]" },
  Egg:                    { icon: "egg",        bg: "bg-[#FEF3C7]" },
  "Poisonous Plant":      { icon: "skull",      bg: "bg-[#FEE2E2]" },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = { icon: "search", bg: "bg-primary/10" };

export function getCategoryStyle(categoryEn: string): CategoryStyle {
  return CATEGORY_STYLES[categoryEn] ?? DEFAULT_CATEGORY_STYLE;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build:static 2>&1 | head -20`
Expected: No errors. (The old `CATEGORY_ICONS` is marked deprecated and may have consumers — check next step.)

- [ ] **Step 3: Check for remaining consumers of old CATEGORY_ICONS**

Run: `grep -r "CATEGORY_ICONS\|getCategoryIcon" src/ --include="*.tsx" --include="*.ts"`

If any files still import the old exports, update them to use `CATEGORY_STYLES` / `getCategoryStyle`. If no consumers, remove the old exports entirely.

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: replace emoji CATEGORY_ICONS with SVG icon+color mapping"
```

---

## Task 3: Redesign CategoryGrid Component

**Files:**
- Modify: `src/components/food/category-grid.tsx`

**Dependencies:** Tasks 1, 2

- [ ] **Step 1: Rewrite CategoryGrid with SVG icons and food count**

Replace the entire content of `src/components/food/category-grid.tsx`:

```tsx
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { FoodCategory } from "@/lib/types";
import { localise } from "@/lib/types";
import { Icons } from "@/components/ui/icon";
import { getCategoryStyle } from "@/lib/constants";

interface CategoryGridProps {
  categories: FoodCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((cat) => {
        const name = localise(cat, "name", locale);
        const style = getCategoryStyle(cat.name_en);
        const Icon = Icons[style.icon];
        return (
          <Link
            key={cat.id}
            href={`/search/category?name=${encodeURIComponent(cat.name_en)}`}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-4 transition-all duration-150 ease-out hover:bg-surface-variant active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.bg}`}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5 text-txt-secondary" />
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-txt">
                {name}
              </span>
              <span className="text-[10px] text-txt-tertiary">
                {t("foodCount", { count: cat.food_count })}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify the `food_count` field exists on FoodCategory type**

Run: `grep -A5 "FoodCategory" src/lib/types.ts`

If `food_count` isn't on the type, check what column name is used in the Zod schema and adjust accordingly.

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/food/category-grid.tsx
git commit -m "feat: redesign category grid with SVG icons, colors, and food counts"
```

---

## Task 4: Redesign Welcome Screen

**Files:**
- Modify: `src/app/welcome/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add new i18n keys for welcome benefit subtitles**

Add to `src/messages/en.json` (before the closing `}`):

```json
"welcomeBenefit1Sub": "Check 200+ foods instantly",
"welcomeBenefit2Sub": "Tailored to your dog's breed & age",
"welcomeBenefit3Sub": "Know what's toxic before it's too late"
```

Add the same keys to `src/messages/tr.json`:

```json
"welcomeBenefit1Sub": "200+ yiyeceği anında kontrol edin",
"welcomeBenefit2Sub": "Köpeğinizin ırkına ve yaşına göre özelleştirilmiş",
"welcomeBenefit3Sub": "Zehirli olanları çok geç olmadan öğrenin"
```

- [ ] **Step 2: Rewrite the welcome page**

Replace the entire content of `src/app/welcome/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const BENEFITS = [
  { icon: Icons.search, titleKey: "welcomeBenefit1", subKey: "welcomeBenefit1Sub", bg: "bg-[#E8F5E9]", iconColor: "text-primary-dark" },
  { icon: Icons.paw,    titleKey: "welcomeBenefit2", subKey: "welcomeBenefit2Sub", bg: "bg-[#FFF3E0]", iconColor: "text-caution" },
  { icon: Icons.safe,   titleKey: "welcomeBenefit3", subKey: "welcomeBenefit3Sub", bg: "bg-[#FFEBEE]", iconColor: "text-toxic" },
] as const;

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-12">
      {/* Branding */}
      <img
        src="/icons/icon-512x512.png"
        alt="PawBalance"
        className="h-[72px] w-[72px] rounded-[18px] shadow-md"
      />

      <h1 className="mt-6 text-center text-3xl font-bold text-txt">
        {t("welcomeTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-txt-secondary">
        {t("welcomeSubtitle")}
      </p>

      {/* Benefit cards */}
      <div className="mt-8 w-full max-w-xs space-y-3">
        {BENEFITS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-card bg-surface p-3.5 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${item.bg}`}>
              <item.icon className={`h-[18px] w-[18px] ${item.iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-txt">{t(item.titleKey)}</p>
              <p className="text-[11px] text-txt-secondary">{t(item.subKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-9 w-full max-w-xs">
        <button
          onClick={() => router.push("/onboarding")}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-primary-btn px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-150 ease-out motion-safe:active:scale-[0.97] active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("getStarted")}
          <Icons.chevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="mt-4 text-center text-sm text-txt-secondary">
          {t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => router.push("/login?redirect=/search")}
            className="font-semibold text-primary-dark transition-colors duration-150 active:opacity-70 focus-visible:underline focus-visible:outline-none"
          >
            {t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
```

Key changes from the original:
- `justify-between` → `justify-center` (fixes dead space)
- Benefits are now cards with `bg-surface shadow-sm` and color-coded icon backgrounds
- Two-line benefits (title + subtitle)
- CTA has chevron arrow icon
- `max-w-xs` → `max-w-sm` on subtitle for i18n
- `motion-safe:` prefix on scale animation

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/welcome/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: redesign welcome screen with benefit cards and centered layout"
```

---

## Task 5: Create EmptyState Component

**Files:**
- Create: `src/components/ui/empty-state.tsx`

- [ ] **Step 1: Create the reusable EmptyState component**

```tsx
import { Icons, type IconName } from "@/components/ui/icon";

interface EmptyStateProps {
  icon: IconName;
  iconBg?: string;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, iconBg = "bg-primary/10", title, subtitle, action }: EmptyStateProps) {
  const Icon = Icons[icon];

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-txt">{title}</h3>
      <p className="max-w-[250px] text-sm text-txt-secondary">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-button bg-primary-btn px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/empty-state.tsx
git commit -m "feat: add reusable EmptyState component"
```

---

## Task 6: Apply EmptyState to Search + Fix Result Count Grammar

**Files:**
- Modify: `src/app/(app)/search/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

**Dependencies:** Task 5

- [ ] **Step 1: Fix the resultsFor i18n key for pluralization**

In `src/messages/en.json`, replace:
```json
"resultsFor": "{count} results for \"{query}\""
```
with:
```json
"resultsFor": "{count, plural, one {1 result} other {# results}} for \"{query}\""
```

In `src/messages/tr.json`, replace the equivalent key:
```json
"resultsFor": "\"{query}\" için {count, plural, one {1 sonuç} other {# sonuç}}"
```

Also add to `en.json`:
```json
"browseCategories": "Browse Categories"
```

And to `tr.json`:
```json
"browseCategories": "Kategorilere Göz At"
```

- [ ] **Step 2: Replace the inline no-results block with EmptyState**

In `src/app/(app)/search/page.tsx`, add the import at the top:

```tsx
import { EmptyState } from "@/components/ui/empty-state";
```

Then replace lines 107-115 (the existing no-results block):

```tsx
<div className="flex flex-col items-center gap-3 py-8">
  <p className="text-txt-secondary">{t("noResults")}</p>
  <button
    onClick={() => setShowRequestDialog(true)}
    className="min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary transition-all duration-150 ease-out hover:bg-primary/5 active:scale-95 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
  >
    {t("requestFood")}
  </button>
</div>
```

with:

```tsx
<div className="flex flex-col gap-4">
  <EmptyState
    icon="searchX"
    title={t("noResults")}
    subtitle={t("noResultsSubtitle")}
    action={{
      label: t("browseCategories"),
      onClick: () => { setQuery(""); clearSearch(); },
    }}
  />
  <button
    onClick={() => setShowRequestDialog(true)}
    className="mx-auto min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary transition-all duration-150 ease-out hover:bg-primary/5 active:scale-95 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
  >
    {t("requestFood")}
  </button>
</div>
```

Also add `"noResultsSubtitle"` to both locale files:
- EN: `"noResultsSubtitle": "Try a different spelling or browse categories"`
- TR: `"noResultsSubtitle": "Farklı bir yazım deneyin veya kategorilere göz atın"`

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/search/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: add empty state to search no-results and fix result count grammar"
```

---

## Task 7: Add "Add to Recipe" Sheet to Food Detail

**Files:**
- Create: `src/components/food/add-to-recipe-sheet.tsx`
- Modify: `src/app/(app)/search/food/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

**Dependencies:** Task 1 (for plus/share icons)

- [ ] **Step 1: Add i18n keys**

Add to `en.json`:
```json
"addToRecipe": "Add to Recipe",
"addedToRecipe": "{food} added to {recipe}",
"createNewRecipe": "Create New Recipe",
"selectRecipe": "Select a recipe",
"noRecipesCreateFirst": "No recipes yet. Create one!"
```

Add Turkish equivalents to `tr.json`:
```json
"addToRecipe": "Tarife Ekle",
"addedToRecipe": "{food}, {recipe} tarifine eklendi",
"createNewRecipe": "Yeni Tarif Oluştur",
"selectRecipe": "Bir tarif seçin",
"noRecipesCreateFirst": "Henüz tarif yok. Bir tane oluşturun!"
```

- [ ] **Step 2: Create the AddToRecipeSheet component**

Create `src/components/food/add-to-recipe-sheet.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/recipe-store";
import { Icons } from "@/components/ui/icon";

interface AddToRecipeSheetProps {
  open: boolean;
  onClose: () => void;
  foodName: string;
  preparation?: string;
  onAdded?: (recipeName: string) => void;
}

export function AddToRecipeSheet({ open, onClose, foodName, preparation, onAdded }: AddToRecipeSheetProps) {
  const t = useTranslations();
  const router = useRouter();
  const recipes = useRecipeStore((s) => s.recipes);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] bg-surface p-5 pb-8 shadow-xl motion-safe:animate-slide-up">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h3 className="mb-4 text-center text-base font-semibold text-txt">
          {t("selectRecipe")}
        </h3>

        {recipes.length === 0 ? (
          <p className="mb-4 text-center text-sm text-txt-secondary">
            {t("noRecipesCreateFirst")}
          </p>
        ) : (
          <div className="mb-4 flex max-h-[240px] flex-col gap-2 overflow-y-auto">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => {
                  onAdded?.(recipe.name);
                  onClose();
                }}
                className="flex min-h-[44px] items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-left transition-all duration-150 ease-out active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icons.bowl className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-txt">{recipe.name}</p>
                  <p className="text-xs text-txt-secondary">
                    {t("ingredientCount", { count: recipe.ingredients.length })}
                  </p>
                </div>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            onClose();
            router.push("/recipes/new");
          }}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-button border border-dashed border-border py-3 text-sm font-medium text-primary transition-all duration-150 ease-out active:scale-95 active:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icons.plus className="h-4 w-4" aria-hidden="true" />
          {t("createNewRecipe")}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Add the slide-up animation to globals.css**

Check if a `slide-up` animation already exists. If not, add to `src/app/globals.css`:

```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 250ms ease-out;
}
```

- [ ] **Step 4: Add action bar to food detail page**

In `src/app/(app)/search/food/page.tsx`, add imports at top:

```tsx
import { useState } from "react";
import { AddToRecipeSheet } from "@/components/food/add-to-recipe-sheet";
```

Add state inside the component (after the existing hooks, around line 18):

```tsx
const [showRecipeSheet, setShowRecipeSheet] = useState(false);
```

Then after the closing `</div>` of the info sections (after line 103), add:

```tsx
{/* Action bar */}
<div className="mt-6 flex gap-2">
  <button
    onClick={() => setShowRecipeSheet(true)}
    className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-button bg-primary-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  >
    <Icons.plus className="h-4 w-4" aria-hidden="true" />
    {t("addToRecipe")}
  </button>
  <button
    onClick={() => {
      if (navigator.share) {
        navigator.share({ title: name, text: `${name} - ${t(food.safety_level === "SAFE" ? "safe" : food.safety_level === "MODERATE" ? "caution" : "toxic")}` });
      }
    }}
    aria-label={t("share")}
    className="flex h-[44px] w-[44px] items-center justify-center rounded-button border border-border bg-surface transition-all duration-150 ease-out active:scale-90 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
  >
    <Icons.share className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
  </button>
</div>

<AddToRecipeSheet
  open={showRecipeSheet}
  onClose={() => setShowRecipeSheet(false)}
  foodName={name}
  preparation={preparation ?? undefined}
/>
```

Also add `"share"` i18n key:
- EN: `"share": "Share"`
- TR: `"share": "Paylaş"`

- [ ] **Step 5: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/food/add-to-recipe-sheet.tsx src/app/(app)/search/food/page.tsx src/app/globals.css src/messages/en.json src/messages/tr.json
git commit -m "feat: add 'Add to Recipe' action bar and bottom sheet to food detail"
```

---

## Task 8: Redesign Scanner Placeholder

**Files:**
- Modify: `src/app/(app)/scan/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add i18n keys**

Add to `en.json`:
```json
"scannerTitle": "Scanner",
"scanFoodLabels": "Scan Food Labels",
"scanDescription": "AI reads ingredients and checks each one for safety",
"howItWorks": "How it works",
"scanStep1": "Point camera at the ingredient list on any dog food package",
"scanStep2": "AI identifies each ingredient and cross-references our safety database",
"scanStep3": "Get a safety report personalized for your dog",
"unlockScanner": "Unlock Scanner",
"includedWithPremium": "Included with PawBalance Premium"
```

Add Turkish equivalents to `tr.json`:
```json
"scannerTitle": "Tarayıcı",
"scanFoodLabels": "Mama Etiketlerini Tarayın",
"scanDescription": "Yapay zeka içerikleri okur ve her birini güvenlik açısından kontrol eder",
"howItWorks": "Nasıl çalışır",
"scanStep1": "Kameranızı herhangi bir köpek maması paketindeki içerik listesine yöneltin",
"scanStep2": "Yapay zeka her bir içeriği belirler ve güvenlik veritabanımızla karşılaştırır",
"scanStep3": "Köpeğinize özel bir güvenlik raporu alın",
"unlockScanner": "Tarayıcıyı Aç",
"includedWithPremium": "PawBalance Premium'a dahil"
```

- [ ] **Step 2: Rewrite the scanner page**

Replace the entire content of `src/app/(app)/scan/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const STEPS = ["scanStep1", "scanStep2", "scanStep3"] as const;

export default function ScanPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
      <h1 className="mb-6 text-center text-lg font-bold text-txt">{t("scannerTitle")}</h1>

      {/* Scan preview card */}
      <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface p-6">
        {/* Viewfinder */}
        <div className="relative mb-4 rounded-xl bg-surface-variant p-8">
          {/* Corner brackets */}
          <div className="absolute left-2 top-2 h-5 w-5 rounded-tl border-l-[3px] border-t-[3px] border-primary" />
          <div className="absolute right-2 top-2 h-5 w-5 rounded-tr border-r-[3px] border-t-[3px] border-primary" />
          <div className="absolute bottom-2 left-2 h-5 w-5 rounded-bl border-b-[3px] border-l-[3px] border-primary" />
          <div className="absolute bottom-2 right-2 h-5 w-5 rounded-br border-b-[3px] border-r-[3px] border-primary" />
          {/* Placeholder label lines */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-1.5 w-[80%] rounded-full bg-border" />
            <div className="h-1.5 w-[60%] rounded-full bg-border" />
            <div className="h-1.5 w-[90%] rounded-full bg-border" />
            <div className="h-1.5 w-[50%] rounded-full bg-border" />
            <div className="h-1.5 w-[75%] rounded-full bg-border" />
          </div>
        </div>
        <h2 className="text-center text-base font-semibold text-txt">{t("scanFoodLabels")}</h2>
        <p className="mt-1 text-center text-sm text-txt-secondary">{t("scanDescription")}</p>
      </div>

      {/* How it works */}
      <div className="mb-4 rounded-card border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-txt">{t("howItWorks")}</h3>
        <div className="flex flex-col gap-3">
          {STEPS.map((stepKey, i) => (
            <div key={stepKey} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-txt">{t(stepKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary-dark p-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Icons.layers className="h-4 w-4 text-white" aria-hidden="true" />
          <span className="font-bold text-white">{t("unlockScanner")}</span>
        </div>
        <p className="mb-4 text-xs text-white/75">{t("includedWithPremium")}</p>
        <button className="w-full rounded-button bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
          {t("upgradeToPremium")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/scan/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: redesign scanner placeholder with viewfinder preview and upgrade CTA"
```

---

## Task 9: Add Google Brand Icon + Auth Input Placeholders

**Files:**
- Modify: `src/components/auth/SocialLoginButtons.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Read current SocialLoginButtons**

Read `src/components/auth/SocialLoginButtons.tsx` to see current Google button markup.

- [ ] **Step 2: Add Google "G" SVG icon**

Find the Google sign-in button in `SocialLoginButtons.tsx` and add an inline SVG before the text. The Google "G" is a standard 4-color mark:

```tsx
<svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
</svg>
```

- [ ] **Step 3: Add placeholder text to login inputs**

In `src/app/(auth)/login/page.tsx`, find the Email and Password inputs and add `placeholder` props:
- Email input: `placeholder="you@example.com"`
- Password input: `placeholder={t("passwordMinLength")}` (reuses existing "Password must be at least 6 characters" key)

- [ ] **Step 4: Add placeholder text to register inputs**

In `src/app/(auth)/register/page.tsx`:
- Display Name: add `placeholder={t("displayNamePlaceholder")}`
- Email: add `placeholder="you@example.com"`
- Password: add `placeholder={t("passwordMinLength")}`
- Confirm Password: add `placeholder={t("confirmPasswordPlaceholder")}`

Add new i18n keys:
- EN: `"displayNamePlaceholder": "How should we call you?"`, `"confirmPasswordPlaceholder": "Re-enter your password"`
- TR: `"displayNamePlaceholder": "Size nasıl hitap edelim?"`, `"confirmPasswordPlaceholder": "Şifrenizi tekrar girin"`

- [ ] **Step 5: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/SocialLoginButtons.tsx src/app/(auth)/login/page.tsx src/app/(auth)/register/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: add Google brand icon and placeholder text to auth forms"
```

---

## Task 10: Profile Menu Grouping + Sign Out Confirmation

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add i18n keys**

Add to `en.json`:
```json
"myAccount": "My Account",
"subscription": "Subscription",
"support": "Support",
"signOutConfirm": "Are you sure you want to sign out?",
"signOutTitle": "Sign Out"
```

Add to `tr.json`:
```json
"myAccount": "Hesabım",
"subscription": "Abonelik",
"support": "Destek",
"signOutConfirm": "Çıkış yapmak istediğinizden emin misiniz?",
"signOutTitle": "Çıkış Yap"
```

- [ ] **Step 2: Rewrite the authenticated menu section**

In `src/app/(app)/profile/page.tsx`, add import for Dialog:

```tsx
import { Dialog } from "@/components/ui/dialog";
```

Add state for sign-out confirmation (next to existing `showLoginSheet` state):

```tsx
const [showSignOutDialog, setShowSignOutDialog] = useState(false);
```

Replace the menu section (lines 84-140 in the authenticated view) with grouped menu:

```tsx
{/* Menu - grouped */}
<div className="flex flex-col gap-5">
  {/* My Account */}
  <div>
    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("myAccount")}</p>
    <div className="flex flex-col gap-2">
      {[
        { href: "/profile/pets", icon: Icons.paw, label: t("pets") },
        { href: "/profile/language", icon: Icons.globe, label: t("language"), trailing: locale === "tr" ? "Türkçe" : "English" },
      ].map((item) => (
        <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
          <Card className="flex items-center gap-3 p-4">
            <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
            <span className="flex-1 font-medium text-txt">{item.label}</span>
            {item.trailing && <span className="text-sm text-txt-secondary">{item.trailing}</span>}
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </Card>
        </Link>
      ))}
    </div>
  </div>

  {/* Subscription */}
  <div>
    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("subscription")}</p>
    <Link href="#" className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
      <Card className="flex items-center gap-3 p-4">
        <Icons.crown className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
        <span className="flex-1 font-medium text-txt">{t("upgradeToPremium")}</span>
        <Badge variant="premium">PRO</Badge>
        <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
      </Card>
    </Link>
  </div>

  {/* Support */}
  <div>
    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("support")}</p>
    <div className="flex flex-col gap-2">
      {[
        { href: "/profile/scan-history", icon: Icons.history, label: t("scanHistory") },
        { href: "#", icon: Icons.help, label: t("helpAndSupport") },
        { href: "#", icon: Icons.info, label: t("about") },
      ].map((item) => (
        <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
          <Card className="flex items-center gap-3 p-4">
            <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
            <span className="flex-1 font-medium text-txt">{item.label}</span>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </Card>
        </Link>
      ))}
    </div>
  </div>
</div>

{/* Sign out with confirmation */}
<button
  onClick={() => setShowSignOutDialog(true)}
  className="mt-6 w-full rounded-button py-3 text-center font-medium text-error transition-all duration-150 ease-out hover:bg-error/5 active:scale-95 active:bg-error/10"
>
  {t("signOut")}
</button>

<Dialog open={showSignOutDialog} onClose={() => setShowSignOutDialog(false)} title={t("signOutTitle")}>
  <p className="mb-4 text-sm text-txt-secondary">{t("signOutConfirm")}</p>
  <div className="flex gap-3">
    <button
      onClick={() => setShowSignOutDialog(false)}
      className="flex-1 rounded-button border border-border py-2.5 text-sm font-medium text-txt transition-all duration-150 ease-out active:scale-95"
    >
      {t("cancel")}
    </button>
    <button
      onClick={() => { setShowSignOutDialog(false); signOut(); }}
      className="flex-1 rounded-button bg-error py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-95"
    >
      {t("signOut")}
    </button>
  </div>
</Dialog>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/profile/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: group profile menu items and add sign-out confirmation dialog"
```

---

## Task 11: Actionable Recipe Analysis Suggestions

**Files:**
- Modify: `src/components/recipe/analysis-report.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add i18n key**

Add to `en.json`: `"addSuggestion": "Add"`
Add to `tr.json`: `"addSuggestion": "Ekle"`

- [ ] **Step 2: Add "+ Add" buttons to suggestions**

In `src/components/recipe/analysis-report.tsx`, add `useState` to the imports:

```tsx
import { useState } from "react";
```

Add `onAddSuggestion` to the props:

```tsx
interface AnalysisReportProps {
  result: AnalysisResult;
  onAddSuggestion?: (suggestion: string) => void;
}
```

Update the component signature:

```tsx
export function AnalysisReport({ result, onAddSuggestion }: AnalysisReportProps) {
```

Add state for tracking added suggestions (after `const t = ...`):

```tsx
const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
```

Replace the suggestions section (lines 158-171) with:

```tsx
{result.suggestions.length > 0 && (
  <div className="mb-3 rounded-xl border border-border bg-surface p-3.5">
    <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
      <Lightbulb className="h-4 w-4" />
      {t("suggestionsSummary")}
    </p>
    <ul className="flex flex-col gap-2">
      {result.suggestions.map((s, i) => (
        <li
          key={i}
          className={`flex items-start gap-2 text-[13px] leading-relaxed ${addedSuggestions.has(i) ? "opacity-50" : ""}`}
        >
          <span className="mt-0.5 text-txt">•</span>
          <span className="flex-1 text-txt">{s}</span>
          {onAddSuggestion && !addedSuggestions.has(i) && (
            <button
              onClick={() => {
                onAddSuggestion(s);
                setAddedSuggestions((prev) => new Set(prev).add(i));
              }}
              className="mt-0.5 shrink-0 rounded-md border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary transition-all duration-150 ease-out active:scale-95 active:bg-primary/5"
            >
              + {t("addSuggestion")}
            </button>
          )}
          {addedSuggestions.has(i) && (
            <Icons.check className="mt-1 h-3.5 w-3.5 shrink-0 text-safe" aria-hidden="true" />
          )}
        </li>
      ))}
    </ul>
  </div>
)}
```

Also add `Icons` import at top:

```tsx
import { Icons } from "@/components/ui/icon";
```

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/analysis-report.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: add actionable '+ Add' buttons to recipe analysis suggestions"
```

---

## Task 12: Pet Card Touch Targets + FoodCard Safety Icons

**Files:**
- Modify: `src/components/pet/pet-card.tsx`
- Modify: `src/components/food/food-card.tsx`

- [ ] **Step 1: Fix pet card touch targets**

In `src/components/pet/pet-card.tsx`, find the edit and delete buttons (lines 45-60). Change `h-9 w-9` to `min-h-[44px] min-w-[44px]` on both buttons:

Replace:
```tsx
className="flex h-9 w-9 items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant hover:text-txt active:scale-90 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
```

With:
```tsx
className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant hover:text-txt active:scale-90 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
```

Do the same for the delete button (change `h-9 w-9` to `min-h-[44px] min-w-[44px]`).

- [ ] **Step 2: Add safety icon to FoodCard accent bar**

In `src/components/food/food-card.tsx`, add a safety icon next to the category initial circle. Replace the category initial div (line 24-26):

```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-sm font-semibold text-primary">
  {category.charAt(0).toUpperCase()}
</div>
```

With a safety-aware icon:

```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant">
  {food.safety_level === "SAFE" && <Icons.safe className="h-4 w-4 text-safe" aria-hidden="true" />}
  {food.safety_level === "MODERATE" && <Icons.caution className="h-4 w-4 text-caution" aria-hidden="true" />}
  {food.safety_level === "TOXIC" && <Icons.toxic className="h-4 w-4 text-toxic" aria-hidden="true" />}
</div>
```

This replaces the color-only letter initial with a safety icon that provides meaning beyond color alone (WCAG 1.4.1).

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/pet/pet-card.tsx src/components/food/food-card.tsx
git commit -m "fix: increase pet card touch targets to 44px and add safety icons to food cards"
```

---

## Task 13: Learn Tab Scroll Affordance + Skeleton Loading States

**Files:**
- Modify: `src/components/blog/blog-tag-chips.tsx`
- Modify: `src/app/(app)/search/category/page.tsx`

- [ ] **Step 1: Add scroll fade to learn tab tag chips**

In `src/components/blog/blog-tag-chips.tsx`, line 29, the scrollable container is:

```tsx
<div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
```

Add the mask-image class to signal scrollability:

```tsx
<div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent_100%)]">
```

- [ ] **Step 2: Add skeleton loading to category browse page**

In `src/app/(app)/search/category/page.tsx`, check if there's already a loading state. If not, add one. The loading state should show:

```tsx
{isLoading ? (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
) : (
  // existing food list
)}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/learn/page.tsx src/app/(app)/search/category/page.tsx
git commit -m "feat: add scroll affordance to learn tab chips and skeleton loading to category browse"
```

---

## Task 14: aria-labels Audit Pass

**Files:**
- Multiple files across the codebase

- [ ] **Step 1: Audit all icon-only buttons**

Run this search to find all icon-only buttons missing aria-label:

```bash
grep -rn '<button' src/ --include="*.tsx" | grep -v 'aria-label'
```

Review each result. Any `<button>` that contains only an icon (no visible text) needs an `aria-label`. Based on the codebase review, these are already mostly covered. Check specifically:

- `src/app/(app)/search/page.tsx` — clear search button (line 84-89): Already has `aria-label={t("cancel")}` ✓
- `src/app/(app)/search/food/page.tsx` — back button: Already has `aria-label="Back"` ✓
- `src/app/(app)/profile/page.tsx` — settings button: Already has `aria-label="Settings"` ✓
- `src/components/pet/pet-card.tsx` — edit/delete: Already has `aria-label` ✓

Fix any that are missing. The new components from earlier tasks (AddToRecipeSheet, scanner page) already include aria-labels.

- [ ] **Step 2: Add prefers-reduced-motion to existing scale animations**

Search for `active:scale-` patterns that don't have `motion-safe:` prefix:

```bash
grep -rn "active:scale-" src/ --include="*.tsx" | head -20
```

For the files we've already modified in this plan, we've added `motion-safe:` where appropriate. For existing files we haven't touched, this is out of scope for this plan to avoid touching unrelated files.

- [ ] **Step 3: Commit (if any changes were made)**

```bash
git add -u
git commit -m "fix: add missing aria-labels to icon-only buttons"
```

---

## Task 15: Final i18n Sync and Build Verification

**Files:**
- Modify: `src/messages/tr.json` (verify all new keys exist)

- [ ] **Step 1: Verify all new EN keys have TR equivalents**

Run a comparison:

```bash
node -e "
const en = require('./src/messages/en.json');
const tr = require('./src/messages/tr.json');
const missing = Object.keys(en).filter(k => !(k in tr));
if (missing.length) { console.log('Missing TR keys:', missing); process.exit(1); }
else { console.log('All keys present in both locales'); }
"
```

Fix any missing keys.

- [ ] **Step 2: Full static build**

Run: `npm run build:static`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add src/messages/tr.json
git commit -m "chore: sync Turkish translations for all new i18n keys"
```

---

## Task 16: Form Validation — On-Blur + Password Hints + inputmode

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

**Note on spec 2.8 (Pet Edit Wizard):** The `PetForm` component (`src/components/pet/pet-form.tsx`) is already a true multi-step wizard with 3 steps, ProgressSteps component, back/next buttons, and per-step validation via Zod. The spec issue was based on screenshot appearance but the code already implements the correct pattern. No changes needed.

- [ ] **Step 1: Add i18n keys for password hint**

Add to `en.json`:
```json
"passwordHint": "At least 6 characters",
"emailInvalid": "Please enter a valid email address",
"fieldRequired": "This field is required"
```

Add to `tr.json`:
```json
"passwordHint": "En az 6 karakter",
"emailInvalid": "Lütfen geçerli bir e-posta adresi girin",
"fieldRequired": "Bu alan zorunludur"
```

- [ ] **Step 2: Add on-blur validation to login page**

In `src/app/(auth)/login/page.tsx`, add field-level error state:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

Add a `validateField` function:

```tsx
function validateField(field: string, value: string) {
  if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setFieldErrors((prev) => ({ ...prev, email: t("emailInvalid") }));
  } else if (field === "email") {
    setFieldErrors((prev) => ({ ...prev, email: "" }));
  }
}
```

Add `onBlur` to the email Input:

```tsx
<Input
  label={t("email")}
  type="email"
  inputMode="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={() => validateField("email", email)}
  autoComplete="email"
  placeholder="you@example.com"
  error={fieldErrors.email || undefined}
  required
/>
```

Add hint text below the PasswordInput (after line 60):

```tsx
<div>
  <PasswordInput
    label={t("password")}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    autoComplete="current-password"
    placeholder={t("passwordHint")}
    required
  />
</div>
```

- [ ] **Step 3: Add on-blur validation to register page**

In `src/app/(auth)/register/page.tsx`, add field-level error state and validation:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

function validateField(field: string, value: string) {
  const errs = { ...fieldErrors };
  if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errs.email = t("emailInvalid");
  } else if (field === "email") {
    errs.email = "";
  }
  if (field === "password" && value && value.length < 6) {
    errs.password = t("passwordMinLength");
  } else if (field === "password" && value.length >= 6) {
    errs.password = "";
  }
  if (field === "confirmPassword" && value && value !== password) {
    errs.confirmPassword = t("passwordsNoMatch");
  } else if (field === "confirmPassword" && value === password) {
    errs.confirmPassword = "";
  }
  setFieldErrors(errs);
}
```

Add `onBlur`, `placeholder`, `inputMode`, and `error` props to each input:

- Display Name: `placeholder={t("displayNamePlaceholder")}`, `error={fieldErrors.displayName || undefined}`
- Email: `inputMode="email"`, `placeholder="you@example.com"`, `onBlur={...}`, `error={fieldErrors.email || undefined}`
- Password: `placeholder={t("passwordHint")}`, `onBlur={...}`, `error={fieldErrors.password || undefined}`
- Confirm Password: `placeholder={t("confirmPasswordPlaceholder")}`, `onBlur={...}`, `error={fieldErrors.confirmPassword || undefined}`

- [ ] **Step 4: Add inputMode to forgot-password email field**

In `src/app/(auth)/forgot-password/page.tsx`, add `inputMode="email"` and `placeholder="you@example.com"` to the email Input.

- [ ] **Step 5: Build and verify**

Run: `npm run build:static 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/(auth)/login/page.tsx src/app/(auth)/register/page.tsx src/app/(auth)/forgot-password/page.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: add on-blur form validation, password hints, and inputMode to auth forms"
```

---

## Summary

| Task | Description | Files Changed | Dependencies |
|------|-------------|---------------|-------------|
| 1 | Add new Lucide icons | icon.tsx | — |
| 2 | Category icon+color mapping | constants.ts | 1 |
| 3 | Redesign CategoryGrid | category-grid.tsx | 1, 2 |
| 4 | Redesign Welcome screen | welcome/page.tsx, en/tr.json | — |
| 5 | Create EmptyState component | empty-state.tsx (new) | — |
| 6 | Search empty state + grammar fix | search/page.tsx, en/tr.json | 5 |
| 7 | Food Detail action bar + sheet | food/page.tsx, add-to-recipe-sheet.tsx (new) | 1 |
| 8 | Redesign Scanner placeholder | scan/page.tsx, en/tr.json | — |
| 9 | Google icon + auth placeholders | SocialLoginButtons, login, register | — |
| 10 | Profile menu grouping + sign-out | profile/page.tsx, en/tr.json | — |
| 11 | Actionable suggestions | analysis-report.tsx, en/tr.json | — |
| 12 | Touch targets + safety icons | pet-card.tsx, food-card.tsx | — |
| 13 | Scroll affordance + skeletons | learn/page.tsx, category/page.tsx | — |
| 14 | aria-labels audit | multiple | — |
| 15 | Final i18n sync + build | tr.json | all |
| 16 | Form validation on-blur + hints | login, register, forgot-password | — |

**Note:** Spec section 2.8 (Pet Edit Wizard) is already correctly implemented in code — `PetForm` is a true 3-step wizard. No task needed.

**Parallelizable groups:**
- Tasks 1→2→3 (icon pipeline)
- Tasks 4, 5→6, 8, 9, 10, 11, 12, 13, 16 (all independent)
- Task 7 depends on Task 1
- Tasks 14, 15 run last
