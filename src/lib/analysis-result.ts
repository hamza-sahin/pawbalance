import type {
  AnalysisIngredient,
  AnalysisResult,
  AnalysisSafety,
  DetailCardAction,
  FollowUpAction,
  RecipeEditAction,
} from "@/lib/types";

function isSafety(value: unknown): value is AnalysisSafety {
  return value === "safe" || value === "moderate" || value === "toxic";
}

function normalizeIngredient(value: unknown): AnalysisIngredient | null {
  if (!value || typeof value !== "object") return null;

  const ingredient = value as Record<string, unknown>;
  const safetyLevel = isSafety(ingredient.safety_level)
    ? ingredient.safety_level
    : "moderate";

  return {
    name: typeof ingredient.name === "string" ? ingredient.name : "",
    safety_level: safetyLevel,
    preparation_ok:
      typeof ingredient.preparation_ok === "boolean"
        ? ingredient.preparation_ok
        : true,
    notes: typeof ingredient.notes === "string" ? ingredient.notes : "",
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeFollowUpAction(value: unknown): FollowUpAction | null {
  if (!value || typeof value !== "object") return null;

  const action = value as Record<string, unknown>;
  if (action.type === "recipe_edit") {
    return {
      type: "recipe_edit",
      label: typeof action.label === "string" ? action.label : "",
      ingredient_id:
        typeof action.ingredient_id === "string" ? action.ingredient_id : "",
      new_name: typeof action.new_name === "string" ? action.new_name : "",
      new_preparation:
        typeof action.new_preparation === "string"
          ? action.new_preparation
          : "",
    } satisfies RecipeEditAction;
  }

  if (action.type === "detail_card") {
    const icon =
      action.icon === "pill" ||
      action.icon === "heart" ||
      action.icon === "alert" ||
      action.icon === "lightbulb" ||
      action.icon === "shield"
        ? action.icon
        : "lightbulb";

    return {
      type: "detail_card",
      label: typeof action.label === "string" ? action.label : "",
      icon,
      detail: typeof action.detail === "string" ? action.detail : "",
    } satisfies DetailCardAction;
  }

  return null;
}

export function normalizeAnalysisResult(value: unknown): AnalysisResult | null {
  if (!value || typeof value !== "object") return null;

  const result = value as Record<string, unknown>;
  const overallSafety = isSafety(result.overall_safety)
    ? result.overall_safety
    : "moderate";

  return {
    overall_safety: overallSafety,
    ingredients: Array.isArray(result.ingredients)
      ? result.ingredients
          .map(normalizeIngredient)
          .filter((item): item is AnalysisIngredient => item !== null)
      : [],
    safety_alerts: normalizeStringArray(result.safety_alerts),
    preparation_warnings: normalizeStringArray(result.preparation_warnings),
    benefits_summary: normalizeStringArray(result.benefits_summary),
    suggestions: normalizeStringArray(result.suggestions),
    follow_up_actions: Array.isArray(result.follow_up_actions)
      ? result.follow_up_actions
          .map(normalizeFollowUpAction)
          .filter((item): item is FollowUpAction => item !== null)
      : [],
  };
}
