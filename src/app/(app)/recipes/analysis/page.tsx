"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, XCircle, RefreshCw, Pencil, Loader2, AlertTriangle } from "lucide-react";
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
  const forceReanalyze = searchParams.get("reanalyze") === "true";
  const { locale } = useLocale();
  const { recipes, fetchRecipes, applyIngredientSwap } = useRecipes();
  const recipe = recipes.find((r) => r.id === recipeId);
  const storedAnalysis = useRecipeStore((s) =>
    recipeId ? s.analyses[recipeId] : undefined,
  );

  const { status, ingredientProgress, result, error, analyze } =
    useRecipeAnalysis();

  // Fetch recipes if store is empty (direct navigation)
  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  // Auto-start analysis on mount (if no completed analysis or forced reanalyze)
  useEffect(() => {
    if (recipeId && recipe && status === "idle" && (forceReanalyze || !storedAnalysis?.result)) {
      analyze(recipeId, recipe.pet_id, locale);
    }
  }, [recipeId, recipe, status, storedAnalysis, forceReanalyze, analyze, locale]);

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

  // Detect stale analysis — current ingredients differ from analyzed ingredients
  const isStale = (() => {
    if (!recipe || !displayResult || displayStatus !== "completed") return false;
    const analyzedNames = new Set(displayResult.ingredients.map((i) => i.name.toLowerCase()));
    const currentNames = new Set(recipe.recipe_ingredients.map((i) => i.name.toLowerCase()));
    if (analyzedNames.size !== currentNames.size) return true;
    for (const name of currentNames) {
      if (!analyzedNames.has(name)) return true;
    }
    return false;
  })();

  return (
    <div>
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => router.back()}
          aria-label={t("back")}
        >
          <ChevronLeft className="h-5 w-5 text-txt-secondary" />
        </button>
        <h1 className="text-[17px] font-bold text-txt">
          {t("recipeAnalysis")}
        </h1>
      </div>

      <div className="p-4">
        {/* Loading recipe data */}
        {!recipe && displayStatus === "idle" && (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
          </div>
        )}

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
