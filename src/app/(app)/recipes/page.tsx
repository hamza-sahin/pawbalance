"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { useRecipes } from "@/hooks/use-recipes";
import { usePetStore } from "@/store/pet-store";

export default function RecipesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { recipes, isLoading, analyses, fetchRecipes } = useRecipes();
  const { pets } = usePetStore();
  const pathname = usePathname();

  // Re-fetch every time this page is navigated to (pathname changes back to /recipes)
  useEffect(() => {
    fetchRecipes();
  }, [pathname, fetchRecipes]);

  const getPetName = (petId: string | null) =>
    pets.find((p) => p.id === petId)?.name;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-1.5 text-[17px] font-semibold text-txt">
          {t("noRecipesYet")}
        </p>
        <p className="mb-6 text-sm leading-relaxed text-txt-secondary">
          {t("noRecipesDescription")}
        </p>
        <Button onClick={() => router.push("/recipes/new")}>
          <Plus className="mr-2 h-[18px] w-[18px]" />
          {t("newRecipe")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-txt">{t("myRecipes")}</h1>
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            analysis={analyses[recipe.id]}
            petName={getPetName(recipe.pet_id)}
          />
        ))}
      </div>
      <div className="mt-4">
        <Button fullWidth onClick={() => router.push("/recipes/new")}>
          <Plus className="mr-2 h-[18px] w-[18px]" />
          {t("newRecipe")}
        </Button>
      </div>
    </div>
  );
}
