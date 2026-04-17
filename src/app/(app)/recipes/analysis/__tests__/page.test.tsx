import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import AnalysisPage from "../page";

const { analysisProgressMock } = vi.hoisted(() => ({
  analysisProgressMock: vi.fn(
    ({ reportFooter }: { reportFooter?: React.ReactNode }) => (
      <div>
        <div>AnalysisProgress</div>
        {reportFooter}
      </div>
    ),
  ),
}));

const push = vi.fn();
const back = vi.fn();
const fetchRecipes = vi.fn();
const applyIngredientSwap = vi.fn();
const guardAction = vi.fn(() => true);
const canPerform = vi.fn(() => true);
const dismissPaywall = vi.fn();
const analyze = vi.fn();

let analysisStatus: "idle" | "pending" | "completed" | "failed" = "idle";
let analysisRecipeId: string | null = null;
let analysisIngredientProgress: Array<{
  id: string;
  name: string;
  status: "pending" | "checking" | "done";
  safety?: string;
}> = [];
let analysisResult: Record<string, unknown> | null = null;

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
  useRecipeAnalysis: (currentRecipeId?: string | null) => {
    const isActiveForRecipe =
      currentRecipeId !== null &&
      currentRecipeId !== undefined &&
      analysisRecipeId === currentRecipeId;

    return {
      recipeId: isActiveForRecipe ? analysisRecipeId : null,
      status: isActiveForRecipe ? analysisStatus : "idle",
      ingredientProgress: isActiveForRecipe ? analysisIngredientProgress : [],
      result: isActiveForRecipe ? analysisResult : null,
      error: null,
      analyze,
    };
  },
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
  AnalysisProgress: analysisProgressMock,
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

beforeEach(() => {
  push.mockReset();
  back.mockReset();
  fetchRecipes.mockReset();
  applyIngredientSwap.mockReset();
  guardAction.mockClear();
  canPerform.mockClear();
  dismissPaywall.mockReset();
  analyze.mockReset();
  analysisProgressMock.mockClear();
  analysisStatus = "idle";
  analysisRecipeId = null;
  analysisIngredientProgress = [];
  analysisResult = null;
});

it("renders stored analysis when legacy result omits follow-up actions", () => {
  expect(() => render(<AnalysisPage />)).not.toThrow();

  expect(screen.getByText("AnalysisReport")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "editRecipe" })).toBeInTheDocument();
});

it("passes completed action buttons into the active progress report state", () => {
  analysisRecipeId = "recipe-1";
  analysisStatus = "pending";
  analysisIngredientProgress = [
    {
      id: "ingredient-1",
      name: "chicken",
      status: "checking",
    },
  ];
  const { rerender } = render(<AnalysisPage />);

  analysisStatus = "completed";
  analysisIngredientProgress = [
    {
      id: "ingredient-1",
      name: "chicken",
      status: "done",
      safety: "safe",
    },
  ];
  analysisResult = {
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
    follow_up_actions: [],
  };

  rerender(<AnalysisPage />);

  expect(screen.getByText("AnalysisProgress")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "editRecipe" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "reAnalyze" })).toBeInTheDocument();
});

it("ignores stale completed active analysis when opening a stored analysis view", () => {
  analysisRecipeId = "recipe-1";
  analysisStatus = "completed";
  analysisIngredientProgress = [
    {
      id: "ingredient-1",
      name: "chicken",
      status: "done",
      safety: "safe",
    },
  ];
  analysisResult = {
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
    follow_up_actions: [],
  };

  render(<AnalysisPage />);

  expect(screen.queryByText("AnalysisProgress")).toBeNull();
  expect(screen.getByText("AnalysisReport")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "editRecipe" })).toBeInTheDocument();
});

it("ignores active analysis from a different recipe when showing stored results", () => {
  analysisRecipeId = "recipe-2";
  analysisStatus = "pending";
  analysisIngredientProgress = [
    {
      id: "ingredient-2",
      name: "rice",
      status: "checking",
    },
  ];

  render(<AnalysisPage />);

  expect(screen.queryByText("AnalysisProgress")).toBeNull();
  expect(screen.getByText("AnalysisReport")).toBeInTheDocument();
});
