"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { useRecipes } from "@/hooks/use-recipes";
import type { RecipeFormValues } from "@/lib/validators";
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { AppScreen } from "@/components/navigation/app-screen";

export default function NewRecipePage() {
  const t = useTranslations();
  const router = useRouter();
  const { createRecipe } = useRecipes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

  const handleSubmit = async (values: RecipeFormValues) => {
    if (!guardAction("recipes.create")) return;
    setIsSubmitting(true);
    try {
      const recipe = await createRecipe(values);
      router.replace(`/recipes/edit?id=${recipe.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/recipes");
  };

  return (
    <AppScreen
      title={t("newRecipe")}
      showBack
      onBack={handleBack}
      shellMode="stacked"
      contentClassName="p-4"
    >
      <RecipeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      {isPaywallOpen && paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
      )}
    </AppScreen>
  );
}
