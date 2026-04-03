"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IngredientProgress } from "@/hooks/use-recipe-analysis";

interface AnalysisProgressProps {
  recipeName: string;
  ingredients: IngredientProgress[];
}

export function AnalysisProgress({
  recipeName,
  ingredients,
}: AnalysisProgressProps) {
  const t = useTranslations();

  return (
    <div>
      <div className="py-5 text-center">
        <Loader2 className="mx-auto mb-3.5 h-12 w-12 motion-safe:animate-spin text-primary" />
        <p className="font-semibold text-txt">
          {t("analyzingRecipe", { recipeName })}
        </p>
        <p className="text-[13px] text-txt-secondary">
          {t("checkingIngredients", { count: ingredients.length })}
        </p>
      </div>

      <Card>
        {ingredients.map((ing, i) => (
          <div
            key={ing.id}
            className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
              i < ingredients.length - 1 ? "border-b border-border" : ""
            }`}
          >
            {ing.status === "done" && (
              <Check className="h-[18px] w-[18px] flex-shrink-0 text-safe" />
            )}
            {ing.status === "checking" && (
              <Loader2 className="h-[18px] w-[18px] flex-shrink-0 motion-safe:animate-spin text-primary" />
            )}
            {ing.status === "pending" && (
              <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-border" />
              </div>
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  ing.status === "pending" ? "text-txt-tertiary" : "text-txt"
                }`}
              >
                {ing.name}
              </p>
              <p className="text-xs text-txt-secondary">
                {ing.status === "done" && ing.safety
                  ? ing.safety.charAt(0).toUpperCase() + ing.safety.slice(1)
                  : ing.status === "checking"
                    ? t("ingredientChecking")
                    : t("ingredientPending")}
              </p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-4 space-y-3">
        <Skeleton className="h-3.5 w-[120px]" />
        <Skeleton className="h-[60px] w-full rounded-xl" />
        <Skeleton className="h-3.5 w-[90px]" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
