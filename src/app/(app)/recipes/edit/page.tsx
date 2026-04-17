"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Eye, RefreshCw } from "lucide-react";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes } from "@/hooks/use-recipes";
import { useRecipeStore } from "@/store/recipe-store";
import type { RecipeFormValues } from "@/lib/validators";
import type { RecipeAnalysis } from "@/lib/types";
import { AppScreen } from "@/components/navigation/app-screen";

export default function EditRecipePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { recipes, fetchRecipes, editRecipe, deleteRecipe } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recipes if store is empty (direct navigation)
  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  const recipe = recipes.find((r) => r.id === recipeId);
  const analysis: RecipeAnalysis | undefined = useRecipeStore(
    (s) => (recipeId ? s.analyses[recipeId] : undefined),
  );

  const hasAnalysis = analysis?.status === "completed" && analysis.result;
  const recipeChangedSinceAnalysis =
    hasAnalysis && recipe
      ? new Date(recipe.updated_at) > new Date(analysis.created_at)
      : false;

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
    if (hasAnalysis && !recipeChangedSinceAnalysis) {
      // View existing analysis
      router.push(`/recipes/analysis?id=${recipeId}`);
    } else {
      // Start new analysis (force reanalyze)
      router.push(`/recipes/analysis?id=${recipeId}&reanalyze=true`);
    }
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    if (!confirm(t("deleteRecipeConfirm"))) return;
    await deleteRecipe(recipeId);
    router.replace("/recipes");
  };

  const handleBack = () => {
    router.push("/recipes");
  };

  if (!recipe) {
    return (
      <AppScreen
        title={t("editRecipe")}
        showBack
        onBack={handleBack}
        shellMode="stacked"
        contentClassName="p-4"
      >
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppScreen>
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
    <AppScreen
      title={t("editRecipe")}
      showBack
      onBack={handleBack}
      shellMode="stacked"
      contentClassName="p-4"
      trailing={
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] text-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={handleDelete}
          aria-label={t("deleteRecipe")}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      }
    >
      <RecipeForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onAnalyze={handleAnalyze}
        showAnalyze={recipe.recipe_ingredients.length > 0}
        analyzeLabel={
          hasAnalysis
            ? recipeChangedSinceAnalysis
              ? t("reAnalyze")
              : t("viewAnalysis")
            : undefined
        }
        analyzeIcon={
          hasAnalysis ? (
            recipeChangedSinceAnalysis ? (
              <RefreshCw className="mr-2 h-[18px] w-[18px]" />
            ) : (
              <Eye className="mr-2 h-[18px] w-[18px]" />
            )
          ) : undefined
        }
        isSubmitting={isSubmitting}
      />
    </AppScreen>
  );
}
