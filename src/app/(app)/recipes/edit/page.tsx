"use client";

import { useState } from "react";
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
            className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => router.back()}
            aria-label={t("back")}
          >
            <ChevronLeft className="h-5 w-5 text-txt-secondary" />
          </button>
          <h1 className="text-[17px] font-bold text-txt">
            {t("editRecipe")}
          </h1>
        </div>
        <button
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-[10px] text-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
