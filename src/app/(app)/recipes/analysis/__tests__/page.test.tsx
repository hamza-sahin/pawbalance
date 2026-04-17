import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AnalysisPage from "../page";

const push = vi.fn();
const back = vi.fn();
const fetchRecipes = vi.fn();
const applyIngredientSwap = vi.fn();
const guardAction = vi.fn(() => true);
const canPerform = vi.fn(() => true);
const dismissPaywall = vi.fn();
const analyze = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useSearchParams: () => new URLSearchParams("id=recipe-1"),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({ locale: "en" }),
}));

vi.mock("@/hooks/use-recipes", () => ({
  useRecipes: () => ({
    recipes: [
      {
        id: "recipe-1",
        owner_id: "user-1",
        pet_id: null,
        name: "yemek",
        created_at: "2026-04-17T00:00:00.000Z",
        updated_at: "2026-04-17T00:00:00.000Z",
        recipe_ingredients: [
          {
            id: "ingredient-1",
            recipe_id: "recipe-1",
            name: "chicken",
            preparation: "boiled",
            sort_order: 0,
          },
        ],
      },
    ],
    fetchRecipes,
    applyIngredientSwap,
  }),
}));

vi.mock("@/hooks/use-recipe-analysis", () => ({
  useRecipeAnalysis: () => ({
    status: "idle",
    ingredientProgress: [],
    result: null,
    error: null,
    analyze,
  }),
}));

vi.mock("@/hooks/use-entitlement", () => ({
  useEntitlement: () => ({
    guardAction,
    canPerform,
    isPaywallOpen: false,
    paywallTier: null,
    dismissPaywall,
  }),
}));

vi.mock("@/store/recipe-store", () => ({
  useRecipeStore: (selector: (state: unknown) => unknown) =>
    selector({
      analyses: {
        "recipe-1": {
          id: "analysis-1",
          recipe_id: "recipe-1",
          pet_id: null,
          status: "completed",
          result: {
            overall_safety: "safe",
            ingredients: [
              {
                name: "chicken",
                safety_level: "safe",
                preparation_ok: true,
                notes: "Looks safe.",
              },
            ],
            safety_alerts: [],
            preparation_warnings: [],
            benefits_summary: [],
            suggestions: [],
          },
          model_used: "test-model",
          created_at: "2026-04-17T00:00:00.000Z",
        },
      },
    }),
}));

vi.mock("@/components/recipe/analysis-progress", () => ({
  AnalysisProgress: () => <div>AnalysisProgress</div>,
}));

vi.mock("@/components/recipe/analysis-report", () => ({
  AnalysisReport: () => <div>AnalysisReport</div>,
}));

vi.mock("@/components/recipe/follow-up-actions", () => ({
  FollowUpActions: () => <div>FollowUpActions</div>,
}));

vi.mock("@/components/subscription/PaywallSheet", () => ({
  PaywallSheet: () => null,
}));

it("renders stored analysis when legacy result omits follow-up actions", () => {
  expect(() => render(<AnalysisPage />)).not.toThrow();

  expect(screen.getByText("AnalysisReport")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "editRecipe" })).toBeInTheDocument();
});
