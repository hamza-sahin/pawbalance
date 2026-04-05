"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { useRecipes } from "@/hooks/use-recipes";
import type { RecipeFormValues } from "@/lib/validators";
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";

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
        <h1 className="text-[17px] font-bold text-txt">{t("newRecipe")}</h1>
      </div>
      <div className="p-4">
        <RecipeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
      {isPaywallOpen && paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
      )}
    </div>
  );
}
