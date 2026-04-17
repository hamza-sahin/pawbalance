"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { XCircle, RefreshCw, Pencil, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisProgress } from "@/components/recipe/analysis-progress";
import { AnalysisReport } from "@/components/recipe/analysis-report";
import { FollowUpActions } from "@/components/recipe/follow-up-actions";
import { useRecipeAnalysis } from "@/hooks/use-recipe-analysis";
import { useRecipeStore } from "@/store/recipe-store";
import { useRecipes } from "@/hooks/use-recipes";
import { useLocale } from "@/hooks/use-locale";
import { normalizeAnalysisResult } from "@/lib/analysis-result";
import type { RecipeEditAction } from "@/lib/types";
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { AppScreen } from "@/components/navigation/app-screen";

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

  const [hasLiveAnalysisSession, setHasLiveAnalysisSession] = useState(false);
  const {
    recipeId: activeRecipeId,
    status,
    ingredientProgress,
    result,
    error,
    analyze,
  } = useRecipeAnalysis(recipeId);
  const { guardAction, canPerform, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

  // Fetch recipes if store is empty (direct navigation)
  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  useEffect(() => {
    setHasLiveAnalysisSession(false);
  }, [recipeId, forceReanalyze]);

  useEffect(() => {
    if (activeRecipeId === recipeId && status === "pending") {
      setHasLiveAnalysisSession(true);
    }
  }, [activeRecipeId, recipeId, status]);

  // Auto-start analysis on mount (if no completed analysis or forced reanalyze)
  useEffect(() => {
    if (recipeId && recipe && status === "idle" && (forceReanalyze || !storedAnalysis?.result)) {
      if (canPerform("recipes.analyze")) {
        setHasLiveAnalysisSession(true);
        analyze(recipeId, recipe.pet_id, locale);
      }
    }
  }, [recipeId, recipe, status, storedAnalysis, forceReanalyze, analyze, locale, canPerform]);

  const handleRetry = () => {
    if (!guardAction("recipes.analyze")) return;
    if (recipeId && recipe) {
      setHasLiveAnalysisSession(true);
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
      setHasLiveAnalysisSession(true);
      analyze(recipeId, updatedRecipe.pet_id, locale);
    }
  };

  const shouldUseActiveAnalysis =
    activeRecipeId === recipeId &&
    (
      status === "pending" ||
      (!storedAnalysis?.result && status === "failed") ||
      (hasLiveAnalysisSession && (status === "completed" || status === "failed"))
    );

  const displayResult = normalizeAnalysisResult(
    shouldUseActiveAnalysis ? result ?? storedAnalysis?.result : storedAnalysis?.result,
  );
  const displayIngredientProgress = shouldUseActiveAnalysis ? ingredientProgress : [];
  const displayError = shouldUseActiveAnalysis ? error : null;
  const displayStatus = shouldUseActiveAnalysis
    ? status
    : storedAnalysis?.result
      ? "completed"
      : "idle";

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

  const handleBack = () => {
    if (recipeId) {
      router.push(`/recipes/edit?id=${recipeId}`);
      return;
    }
    router.push("/recipes");
  };

  const completedActions = displayResult ? (
    <>
      {displayResult.follow_up_actions.length > 0 && (
        <FollowUpActions
          actions={displayResult.follow_up_actions}
          onRecipeEdit={handleRecipeEdit}
        />
      )}

      <div className="flex gap-2.5">
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
  ) : null;

  return (
    <AppScreen
      title={t("recipeAnalysis")}
      showBack
      onBack={handleBack}
      shellMode="stacked"
      contentClassName="p-4"
    >
        {/* Loading recipe data */}
        {!recipe && displayStatus === "idle" && (
          <div className="flex min-h-[350px] items-center justify-center">
            <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
          </div>
        )}

        {/* Streaming progress + celebration + report (only during active analysis) */}
        {(displayStatus === "pending" || (displayStatus === "completed" && displayIngredientProgress.length > 0)) && recipe && (
          <AnalysisProgress
            recipeName={recipe.name}
            ingredients={displayIngredientProgress}
            result={displayResult}
            status={displayStatus}
            reportFooter={completedActions}
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
              {displayError ?? t("analysisFailedDescription")}
            </p>
            <Button onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
        )}

        {/* Action buttons — shown when viewing stored analysis (no active stream) */}
        {displayStatus === "completed" && displayResult && displayIngredientProgress.length === 0 && (
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

            <div className="mt-4 space-y-4">{completedActions}</div>
          </>
        )}
      {isPaywallOpen && paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
      )}
    </AppScreen>
  );
}
