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
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { AppScreen } from "@/components/navigation/app-screen";

export default function RecipesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { recipes, isLoading, analyses, fetchRecipes } = useRecipes();
  const { pets } = usePetStore();
  const pathname = usePathname();
  const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

  const handleNewRecipe = () => {
    if (!guardAction("recipes.create")) return;
    router.push("/recipes/new");
  };

  // Re-fetch every time this page is navigated to (pathname changes back to /recipes)
  useEffect(() => {
    fetchRecipes();
  }, [pathname, fetchRecipes]);

  const getPetName = (petId: string | null) =>
    pets.find((p) => p.id === petId)?.name;

  if (isLoading && recipes.length === 0) {
    return (
      <AppScreen title={t("myRecipes")} shellMode="tabbed" contentClassName="p-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppScreen>
    );
  }

  if (recipes.length === 0) {
    return (
      <AppScreen title={t("myRecipes")} shellMode="tabbed" contentClassName="p-4">
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
          <Button onClick={handleNewRecipe}>
            <Plus className="mr-2 h-[18px] w-[18px]" />
            {t("newRecipe")}
          </Button>
        </div>
        {isPaywallOpen && paywallTier && (
          <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
        )}
      </AppScreen>
    );
  }

  return (
    <AppScreen title={t("myRecipes")} shellMode="tabbed" contentClassName="p-4">
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
        <Button fullWidth onClick={handleNewRecipe}>
          <Plus className="mr-2 h-[18px] w-[18px]" />
          {t("newRecipe")}
        </Button>
      </div>
      {isPaywallOpen && paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
      )}
    </AppScreen>
  );
}
