"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, XCircle, RefreshCw, Pencil, Loader2 } from "lucide-react";
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
