# Recipe Ingredient UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current always-open ingredient composer with a list-first ingredient editor that uses a bottom sheet for creation, prepends newly added ingredients, and supports inline row editing with invalid-edit guardrails.

**Architecture:** Keep `RecipeForm` as the page-level coordinator for recipe save/analyze actions, but move ingredient creation and editing concerns into focused recipe subcomponents. Add a reusable add-sheet component for creation, a row component for collapsed/expanded ingredient editing, and a local food-suggestion hook that offers search assistance without polluting global search-page state.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, next-intl, Zustand, Supabase RPC, Vitest + Testing Library

---

## File Map

- Modify: `package.json`
  - Add test scripts and test dev dependencies guidance.
- Create: `vitest.config.ts`
  - Configure Vitest for React + jsdom + `@/` alias resolution.
- Create: `src/test/setup.ts`
  - Shared test setup for RTL, DOM cleanup, and browser API shims.
- Create: `src/components/recipe/__tests__/ingredient-list.test.tsx`
  - Covers sheet open/add flow, prepend ordering, inline row edit, and invalid-switch guard.
- Create: `src/components/recipe/__tests__/recipe-form.test.tsx`
  - Smoke-tests recipe form structure and ingredient section placement.
- Modify: `src/hooks/use-food-search.ts`
  - Add a local `useFoodSuggestions` hook for debounced ingredient suggestions.
- Create: `src/components/recipe/add-ingredient-sheet.tsx`
  - Focused ingredient creation sheet with required name + preparation and optional suggestions.
- Create: `src/components/recipe/ingredient-row.tsx`
  - Encapsulates collapsed and expanded ingredient row rendering.
- Modify: `src/components/recipe/ingredient-list.tsx`
  - Orchestrates add sheet, ingredient list ordering, inline edit state, and empty state.
- Modify: `src/components/recipe/recipe-form.tsx`
  - Keeps ingredient section between pet selector and recipe actions; no ingredient-creation logic stays here.
- Modify: `src/messages/en.json`
  - Add/adjust copy for count, empty state, edit/remove labels, and accessible row actions.
- Modify: `src/messages/tr.json`
  - Turkish equivalents for the same copy.

## Implementation Notes

- Reuse `src/components/ui/empty-state.tsx` for the zero-ingredient state.
- Reuse `src/components/recipe/preparation-chips.tsx` for preparation selection.
- Use `localise(food, "name", locale)` from `src/lib/types.ts` when filling from a suggestion.
- Keep manual ingredient entry fully allowed even when suggestions exist.
- When switching from one expanded row to another:
  - If current draft is valid and changed, auto-save before switching.
  - If current draft is invalid, keep current row open and block switch.
- New ingredients must be inserted at index `0` so they appear above the existing list.

---

### Task 1: Add Test Harness and Lock the New UX in Failing Tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/components/recipe/__tests__/ingredient-list.test.tsx`

- [ ] **Step 1: Install the test dependencies**

Run:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: install completes and `package.json`/lockfile record the new dev dependencies.

- [ ] **Step 2: Update `package.json` scripts for test execution**

Update `package.json` to include test commands alongside the existing scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:static": "next build",
    "build:server": "BUILD_MODE=server next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

- [ ] **Step 4: Add shared test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserver);
window.HTMLElement.prototype.scrollIntoView = vi.fn();
```

- [ ] **Step 5: Write the first failing ingredient-list test**

Create `src/components/recipe/__tests__/ingredient-list.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import en from "@/messages/en.json";
import { IngredientList } from "../ingredient-list";

const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc: rpcMock,
  }),
}));

function renderIngredientList(
  ingredients = [{ name: "Chicken", preparation: "Raw" }],
) {
  const onChange = vi.fn();
  const user = userEvent.setup();

  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <IngredientList ingredients={ingredients} onChange={onChange} />
    </NextIntlClientProvider>,
  );

  return { onChange, user };
}

describe("IngredientList", () => {
  it("opens a bottom sheet instead of showing an inline composer", async () => {
    const { user } = renderIngredientList();

    await user.click(
      screen.getByRole("button", { name: /add ingredient/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /add ingredient/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails against the current UI**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx
```

Expected: FAIL because the current implementation expands an inline form and does not render a bottom-sheet dialog.

- [ ] **Step 7: Commit the harness and failing test**

```bash
git add package.json vitest.config.ts src/test/setup.ts src/components/recipe/__tests__/ingredient-list.test.tsx
git commit -m "test: add recipe ingredient editor harness"
```

---

### Task 2: Build the Add Ingredient Sheet and Prepend New Items

**Files:**
- Modify: `src/hooks/use-food-search.ts`
- Create: `src/components/recipe/add-ingredient-sheet.tsx`
- Modify: `src/components/recipe/ingredient-list.tsx`
- Modify: `src/components/recipe/__tests__/ingredient-list.test.tsx`

- [ ] **Step 1: Add a failing test for required fields, prepend order, and sheet close**

Append this test to `src/components/recipe/__tests__/ingredient-list.test.tsx`:

```tsx
it("prepends a manually entered ingredient and closes the sheet", async () => {
  const { onChange, user } = renderIngredientList([
    { name: "Chicken", preparation: "Raw" },
    { name: "Carrot", preparation: "Boiled" },
  ]);

  await user.click(
    screen.getByRole("button", { name: /add ingredient/i }),
  );

  const sheet = screen.getByRole("dialog", { name: /add ingredient/i });

  await user.type(
    screen.getByLabelText(/ingredient name/i),
    "Salmon",
  );
  await user.click(
    screen.getByRole("button", { name: /boiled/i }),
  );
  await user.click(
    screen.getByRole("button", { name: /^add ingredient$/i }),
  );

  expect(onChange).toHaveBeenLastCalledWith([
    { name: "Salmon", preparation: "Boiled" },
    { name: "Chicken", preparation: "Raw" },
    { name: "Carrot", preparation: "Boiled" },
  ]);
  expect(sheet).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify prepend + close behavior is still missing**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx -t "prepends a manually entered ingredient and closes the sheet"
```

Expected: FAIL because the current inline composer appends ingredients and does not close a sheet.

- [ ] **Step 3: Add a local suggestion hook that does not touch global search-page state**

Append this hook to `src/hooks/use-food-search.ts`:

```ts
export function useFoodSuggestions(query: string, limit = 5) {
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("search_foods", {
        search_query: trimmed,
      });
      if (cancelled) return;
      if (error) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      setSuggestions(((data as Food[]) ?? []).slice(0, limit));
      setIsLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, limit]);

  return { suggestions, isLoading };
}
```

Also update the imports at the top of `src/hooks/use-food-search.ts`:

```ts
import { useState, useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useFoodStore } from "@/store/food-store";
import type { Food, FoodCategory } from "@/lib/types";
```

- [ ] **Step 4: Create the add-sheet component**

Create `src/components/recipe/add-ingredient-sheet.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Search } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useFoodSuggestions } from "@/hooks/use-food-search";
import { ingredientSchema, type IngredientFormValues } from "@/lib/validators";
import { localise } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreparationChips } from "./preparation-chips";

interface AddIngredientSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ingredient: IngredientFormValues) => void;
}

export function AddIngredientSheet({
  open,
  onClose,
  onAdd,
}: AddIngredientSheetProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [preparation, setPreparation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { suggestions, isLoading } = useFoodSuggestions(name);

  useEffect(() => {
    if (!open) {
      setName("");
      setPreparation("");
      setError(null);
    }
  }, [open]);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && preparation.trim().length > 0,
    [name, preparation],
  );

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = ingredientSchema.safeParse({
      name: name.trim(),
      preparation: preparation.trim(),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("ingredientNameRequired"));
      return;
    }

    onAdd(parsed.data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("addIngredient")}
        className="relative w-full max-w-md rounded-t-[20px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border md:hidden" />
        <h2 className="mb-4 text-lg font-bold text-txt">{t("addIngredient")}</h2>

        <div className="space-y-4">
          <Input
            label={t("ingredientName")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            autoFocus
          />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-txt-secondary">
              {t("searchFoods")}
            </p>
            <div className="space-y-2">
              {suggestions.map((food) => {
                const displayName = localise(food, "name", locale);
                return (
                  <button
                    key={food.id}
                    type="button"
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-[12px] border border-border px-3 py-2 text-left transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onClick={() => setName(displayName)}
                  >
                    <Search className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
                    <span className="flex-1 text-sm font-medium text-txt">
                      {displayName}
                    </span>
                    <Check className="h-4 w-4 text-transparent" aria-hidden="true" />
                  </button>
                );
              })}
              {!isLoading && name.trim().length >= 2 && suggestions.length === 0 && (
                <p className="text-sm text-txt-tertiary">{name.trim()}</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-txt-secondary">
              {t("preparationMethod")}
            </p>
            <PreparationChips value={preparation} onChange={setPreparation} />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={!canSubmit}>
            {t("addIngredient")}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Refactor `IngredientList` to use the sheet and prepend new ingredients**

Replace `src/components/recipe/ingredient-list.tsx` with this orchestration-first implementation skeleton:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ingredientSchema, type IngredientFormValues } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { AddIngredientSheet } from "./add-ingredient-sheet";
import { IngredientRow } from "./ingredient-row";

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<IngredientFormValues | null>(null);
  const [editError, setEditError] = useState<string>("");

  const handleAdd = (ingredient: IngredientFormValues) => {
    onChange([ingredient, ...ingredients]);
    setIsAddOpen(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-txt">{t("ingredients")}</h3>
          <p className="text-xs text-txt-secondary">
            {t("ingredientCount", { count: ingredients.length })}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addIngredient")}
        </Button>
      </div>

      {ingredients.length === 0 ? (
        <EmptyState
          icon="search"
          title={t("ingredientsEmptyTitle")}
          subtitle={t("ingredientsEmptySubtitle")}
          action={{
            label: t("addIngredient"),
            onClick: () => setIsAddOpen(true),
          }}
        />
      ) : (
        <div className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <IngredientRow
              key={`${ingredient.name}-${ingredient.preparation}-${index}`}
              ingredient={ingredient}
              index={index}
              isExpanded={expandedIndex === index}
              draft={expandedIndex === index ? draft : null}
              error={expandedIndex === index ? editError : ""}
              onExpand={() => {
                setExpandedIndex(index);
                setDraft(ingredient);
                setEditError("");
              }}
              onDraftChange={setDraft}
              onSave={() => {
                const parsed = ingredientSchema.safeParse(draft);
                if (!parsed.success) {
                  setEditError(parsed.error.issues[0]?.message ?? "");
                  return;
                }
                const next = [...ingredients];
                next[index] = parsed.data;
                onChange(next);
                setExpandedIndex(null);
                setDraft(null);
                setEditError("");
              }}
              onDelete={() => {
                onChange(ingredients.filter((_, current) => current !== index));
                if (expandedIndex === index) {
                  setExpandedIndex(null);
                  setDraft(null);
                  setEditError("");
                }
              }}
              onCollapse={() => {
                setExpandedIndex(null);
                setDraft(null);
                setEditError("");
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}

      <AddIngredientSheet
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
      />
    </section>
  );
}
```

This step intentionally leaves inline row switching behavior incomplete; Task 3 will add the valid-auto-save and invalid-block rules.

- [ ] **Step 6: Run the ingredient-list test suite**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx
```

Expected: PASS for the two add-sheet tests; any row-edit tests not yet written do not exist yet.

- [ ] **Step 7: Commit the add-sheet flow**

```bash
git add src/hooks/use-food-search.ts src/components/recipe/add-ingredient-sheet.tsx src/components/recipe/ingredient-list.tsx src/components/recipe/__tests__/ingredient-list.test.tsx
git commit -m "feat: move recipe ingredient creation into bottom sheet"
```

---

### Task 3: Add Inline Row Editing with Auto-Save on Valid Switch and Block on Invalid Switch

**Files:**
- Create: `src/components/recipe/ingredient-row.tsx`
- Modify: `src/components/recipe/ingredient-list.tsx`
- Modify: `src/components/recipe/__tests__/ingredient-list.test.tsx`

- [ ] **Step 1: Add failing tests for inline editing behavior**

Append these tests to `src/components/recipe/__tests__/ingredient-list.test.tsx`:

```tsx
it("auto-saves valid changes before switching to another row", async () => {
  const { onChange, user } = renderIngredientList([
    { name: "Chicken", preparation: "Raw" },
    { name: "Carrot", preparation: "Boiled" },
  ]);

  await user.click(
    screen.getByRole("button", { name: /edit chicken/i }),
  );
  await user.clear(screen.getByLabelText(/ingredient name/i));
  await user.type(screen.getByLabelText(/ingredient name/i), "Turkey");
  await user.click(screen.getByRole("button", { name: /carrot/i }));

  expect(onChange).toHaveBeenCalledWith([
    { name: "Turkey", preparation: "Raw" },
    { name: "Carrot", preparation: "Boiled" },
  ]);
});

it("keeps the invalid row open when the user tries to switch rows", async () => {
  const { user } = renderIngredientList([
    { name: "Chicken", preparation: "Raw" },
    { name: "Carrot", preparation: "Boiled" },
  ]);

  await user.click(
    screen.getByRole("button", { name: /edit chicken/i }),
  );
  await user.clear(screen.getByLabelText(/ingredient name/i));
  await user.click(
    screen.getByRole("button", { name: /edit carrot/i }),
  );

  expect(screen.getByText(/enter an ingredient name/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  expect(screen.queryByDisplayValue("Carrot")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new row-edit tests to verify they fail**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx -t "row"
```

Expected: FAIL because the current list has no inline row editor and no row-switch guard logic.

- [ ] **Step 3: Create the dedicated row component**

Create `src/components/recipe/ingredient-row.tsx`:

```tsx
"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { IngredientFormValues } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreparationChips } from "./preparation-chips";

interface IngredientRowProps {
  ingredient: IngredientFormValues;
  index: number;
  isExpanded: boolean;
  draft: IngredientFormValues | null;
  error: string;
  onExpand: () => void;
  onDraftChange: (draft: IngredientFormValues) => void;
  onSave: () => void;
  onDelete: () => void;
  onCollapse: () => void;
}

export function IngredientRow({
  ingredient,
  index,
  isExpanded,
  draft,
  error,
  onExpand,
  onDraftChange,
  onSave,
  onDelete,
  onCollapse,
}: IngredientRowProps) {
  const t = useTranslations();

  if (!isExpanded || !draft) {
    return (
      <button
        type="button"
        onClick={onExpand}
        aria-expanded="false"
        aria-label={t("editIngredient", { name: ingredient.name })}
        className="flex min-h-[56px] w-full items-center justify-between rounded-[14px] border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-txt">{ingredient.name}</p>
          <p className="text-xs text-txt-secondary">{ingredient.preparation}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="rounded-[16px] border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-txt">{ingredient.name}</p>
        <button
          type="button"
          onClick={onCollapse}
          aria-label={t("collapseIngredientEditor")}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] text-txt-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <Input
          label={t("ingredientName")}
          value={draft.name}
          onChange={(e) =>
            onDraftChange({ ...draft, name: e.target.value })
          }
          error={error || undefined}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-txt-secondary">
            {t("preparationMethod")}
          </p>
          <PreparationChips
            value={draft.preparation}
            onChange={(preparation) =>
              onDraftChange({ ...draft, preparation })
            }
          />
        </div>

        <div className="flex gap-2">
          <Button fullWidth onClick={onSave}>
            {t("saveChanges")}
          </Button>
          <Button variant="secondary" onClick={onCollapse}>
            {t("cancel")}
          </Button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t("removeIngredient", { name: ingredient.name })}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-border text-error transition-colors hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Teach `IngredientList` how to auto-save valid drafts before row switches and block invalid ones**

Update `src/components/recipe/ingredient-list.tsx` by adding a draft-persistence helper and routing all row taps through it:

```tsx
const persistExpandedDraft = () => {
  if (expandedIndex === null || !draft) return true;

  const parsed = ingredientSchema.safeParse(draft);
  if (!parsed.success) {
    setEditError(parsed.error.issues[0]?.message ?? t("ingredientNameRequired"));
    return false;
  }

  const current = ingredients[expandedIndex];
  const changed =
    current.name !== parsed.data.name ||
    current.preparation !== parsed.data.preparation;

  if (changed) {
    const next = [...ingredients];
    next[expandedIndex] = parsed.data;
    onChange(next);
  }

  return true;
};

const openRow = (index: number) => {
  if (expandedIndex === index) return;
  if (!persistExpandedDraft()) return;
  setExpandedIndex(index);
  setDraft(ingredients[index]);
  setEditError("");
};
```

Then wire the row rendering to the new component:

```tsx
<div className="space-y-2">
  {ingredients.map((ingredient, index) => (
    <IngredientRow
      key={`${ingredient.name}-${ingredient.preparation}-${index}`}
      ingredient={ingredient}
      index={index}
      isExpanded={expandedIndex === index}
      draft={expandedIndex === index ? draft : null}
      error={expandedIndex === index ? editError : ""}
      onExpand={() => openRow(index)}
      onDraftChange={(nextDraft) => {
        setDraft(nextDraft);
        if (editError) setEditError("");
      }}
      onSave={() => {
        if (!persistExpandedDraft()) return;
        setExpandedIndex(null);
        setDraft(null);
        setEditError("");
      }}
      onDelete={() => {
        onChange(ingredients.filter((_, current) => current !== index));
        if (expandedIndex === index) {
          setExpandedIndex(null);
          setDraft(null);
          setEditError("");
        }
      }}
      onCollapse={() => {
        setExpandedIndex(null);
        setDraft(null);
        setEditError("");
      }}
    />
  ))}
</div>
```

- [ ] **Step 5: Run the full ingredient-list test file**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx
```

Expected: PASS for sheet open, prepend ordering, valid auto-save on switch, and invalid row-blocking.

- [ ] **Step 6: Commit the inline editor behavior**

```bash
git add src/components/recipe/ingredient-row.tsx src/components/recipe/ingredient-list.tsx src/components/recipe/__tests__/ingredient-list.test.tsx
git commit -m "feat: add inline recipe ingredient row editing"
```

---

### Task 4: Localize the New Copy and Smoke-Test the Recipe Form Integration

**Files:**
- Modify: `src/components/recipe/recipe-form.tsx`
- Create: `src/components/recipe/__tests__/recipe-form.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add a failing recipe-form smoke test for section order and empty-state integration**

Create `src/components/recipe/__tests__/recipe-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import en from "@/messages/en.json";
import { RecipeForm } from "../recipe-form";

vi.mock("@/store/pet-store", () => ({
  usePetStore: () => ({
    pets: [
      { id: "pet-1", name: "Lupin" },
      { id: "pet-2", name: "Miso" },
    ],
  }),
}));

describe("RecipeForm", () => {
  it("renders the ingredient section before the save action and shows the empty-state CTA", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <RecipeForm onSubmit={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/0 ingredients/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add ingredient$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save recipe/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the smoke test to verify copy and count support are still missing**

Run:

```bash
npm test -- src/components/recipe/__tests__/recipe-form.test.tsx
```

Expected: FAIL because the current copy does not yet provide the new count/empty-state strings in a predictable way.

- [ ] **Step 3: Add the new localized copy**

Update `src/messages/en.json` with these keys or replacements:

```json
{
  "ingredientName": "Ingredient name",
  "ingredientCount": "{count, plural, one {# ingredient} other {# ingredients}}",
  "ingredientsEmptyTitle": "No ingredients yet",
  "ingredientsEmptySubtitle": "Add ingredients one by one to build your recipe.",
  "editIngredient": "Edit {name}",
  "removeIngredient": "Remove {name}",
  "collapseIngredientEditor": "Collapse ingredient editor"
}
```

Update `src/messages/tr.json` with:

```json
{
  "ingredientName": "Malzeme adı",
  "ingredientCount": "{count} malzeme",
  "ingredientsEmptyTitle": "Henüz malzeme yok",
  "ingredientsEmptySubtitle": "Tarifinizi oluşturmak için malzemeleri tek tek ekleyin.",
  "editIngredient": "{name} malzemesini düzenle",
  "removeIngredient": "{name} malzemesini kaldır",
  "collapseIngredientEditor": "Malzeme düzenleyicisini kapat"
}
```

- [ ] **Step 4: Make `RecipeForm` explicitly treat `IngredientList` as a self-contained section**

Keep the ingredient section between pet selection and page actions, and avoid duplicating add-flow UI in `src/components/recipe/recipe-form.tsx`:

```tsx
      <IngredientList
        ingredients={ingredients}
        onChange={(updated) => {
          setIngredients(updated);
          if (errors.ingredients) {
            setErrors((prev) => ({ ...prev, ingredients: "" }));
          }
        }}
        error={errors.ingredients ? t("addAtLeastOneIngredient") : undefined}
      />

      <div className="space-y-3 pt-2">
        <Button fullWidth isLoading={isSubmitting} onClick={handleSave}>
          {t("saveRecipe")}
        </Button>
```

The important part here is **not** a huge structural rewrite in `RecipeForm`; the heavy UX work remains inside `IngredientList`.

- [ ] **Step 5: Run the recipe-form and ingredient-list tests together, then lint**

Run:

```bash
npm test -- src/components/recipe/__tests__/ingredient-list.test.tsx src/components/recipe/__tests__/recipe-form.test.tsx
npm run lint
```

Expected:
- Vitest: PASS
- Lint: PASS

- [ ] **Step 6: Commit the integration and copy updates**

```bash
git add src/components/recipe/recipe-form.tsx src/components/recipe/__tests__/recipe-form.test.tsx src/messages/en.json src/messages/tr.json
git commit -m "feat: finish list-first recipe ingredient ux"
```

---

## Spec Coverage Check

- Bottom-sheet add flow: Task 2
- Required name + preparation: Task 2
- Optional DB suggestions inside sheet: Task 2
- Manual entry always allowed: Task 2
- New ingredient inserted at top: Task 2
- List-first screen structure: Tasks 2 and 4
- Empty state instead of persistent composer: Task 2 + Task 4
- Inline row editing: Task 3
- Invalid switch blocked: Task 3
- Valid switch auto-saves current row before moving: Task 3
- Localized labels and accessible row actions: Task 4
- Separate page-level save action: Task 4

## Placeholder Scan

No `TODO`, `TBD`, or "handle later" placeholders remain. Each code-touching step includes concrete file paths and concrete code.

## Type Consistency Check

- Ingredient creation and editing both use `IngredientFormValues`
- Validation for add and edit both use `ingredientSchema`
- Suggestion fill path writes only `name`; preparation remains independently required
- `IngredientList` stays the single source of truth for list order and expansion state
