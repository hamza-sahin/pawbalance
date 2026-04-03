"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SafetyBadge } from "@/components/food/safety-badge";
import type { RecipeWithIngredients, RecipeAnalysis } from "@/lib/types";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  analysis?: RecipeAnalysis;
  petName?: string;
}

export function RecipeCard({ recipe, analysis, petName }: RecipeCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const ingredientNames = recipe.recipe_ingredients
    .map((i) => i.name)
    .join(", ");

  const safetyLevel = analysis?.result?.overall_safety;
  const alertCount =
    analysis?.result?.safety_alerts?.length ?? 0;

  const handleTap = () => {
    if (analysis?.status === "completed") {
      router.push(`/recipes/analysis?id=${recipe.id}`);
    } else {
      router.push(`/recipes/edit?id=${recipe.id}`);
    }
  };

  return (
    <Card
      className="cursor-pointer touch-manipulation p-4 transition-colors active:bg-canvas focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={handleTap}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-txt">{recipe.name}</p>
          <p className="truncate text-[13px] text-txt-secondary">
            {ingredientNames}
          </p>
        </div>
        {safetyLevel ? (
          <SafetyBadge
            level={safetyLevel === "safe" ? "SAFE" : safetyLevel === "moderate" ? "MODERATE" : "TOXIC"}
          />
        ) : (
          <span className="whitespace-nowrap rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-txt-tertiary">
            {t("notAnalyzed")}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {petName && (
          <span className="flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-xs text-txt-secondary">
            <Clock className="h-3 w-3" />
            {petName}
          </span>
        )}
        <span className="rounded-md bg-canvas px-2 py-1 text-xs text-txt-secondary">
          {t("ingredientCount", { count: recipe.recipe_ingredients.length })}
        </span>
        {alertCount > 0 && (
          <span className="flex items-center gap-1 rounded-md bg-error/10 px-2 py-1 text-xs text-error">
            <AlertTriangle className="h-3 w-3" />
            {t("alertCount", { count: alertCount })}
          </span>
        )}
      </div>
    </Card>
  );
}
