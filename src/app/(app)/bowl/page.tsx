"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";

export default function BowlPage() {
  const t = useTranslations();

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-bold text-txt">{t("bowl")}</h1>
      <h2 className="mb-1 text-xl font-bold text-txt">{t("homeCooking")}</h2>
      <p className="mb-4 text-sm text-txt-secondary">{t("buildMeals")}</p>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
            🍳
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("mealBuilder")}</p>
            <p className="text-sm text-txt-secondary">{t("mealBuilderDesc")}</p>
          </div>
          <span className="text-txt-tertiary">›</span>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
            📊
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("portionCalculator")}</p>
            <p className="text-sm text-txt-secondary">{t("portionCalculatorDesc")}</p>
          </div>
          <span className="text-txt-tertiary">›</span>
        </Card>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 text-center">
        <span className="text-5xl text-txt-tertiary">🍽</span>
        <p className="font-medium text-txt-secondary">{t("comingSoon")}</p>
        <p className="text-sm text-txt-tertiary">{t("mealPlanningComingSoon")}</p>
      </div>
    </div>
  );
}
