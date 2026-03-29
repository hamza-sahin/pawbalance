"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";

export default function BowlPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
      <h1 className="mb-1 text-lg font-bold text-txt">{t("bowl")}</h1>
      <h2 className="mb-1 text-xl font-bold text-txt">{t("homeCooking")}</h2>
      <p className="mb-4 text-sm text-txt-secondary">{t("buildMeals")}</p>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icons.preparation className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("mealBuilder")}</p>
            <p className="text-sm text-txt-secondary">{t("mealBuilderDesc")}</p>
          </div>
          <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icons.weight className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("portionCalculator")}</p>
            <p className="text-sm text-txt-secondary">{t("portionCalculatorDesc")}</p>
          </div>
          <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Icons.bowl className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
        <p className="font-medium text-txt-secondary">{t("comingSoon")}</p>
        <p className="text-sm text-txt-tertiary">{t("mealPlanningComingSoon")}</p>
      </div>
    </div>
  );
}
