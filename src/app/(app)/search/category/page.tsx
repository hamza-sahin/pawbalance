"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFoodsByCategory } from "@/hooks/use-food-search";
import { FoodCard } from "@/components/food/food-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AppScreen } from "@/components/navigation/app-screen";

export default function CategoryPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const categoryName = searchParams.get("name") ?? "";
  const { foods, isLoading, fetchByCategory } = useFoodsByCategory();

  useEffect(() => {
    if (categoryName) fetchByCategory(categoryName);
  }, [categoryName, fetchByCategory]);

  const safeCount = foods.filter((f) => f.safety_level === "SAFE").length;
  const cautionCount = foods.filter((f) => f.safety_level === "MODERATE").length;
  const toxicCount = foods.filter((f) => f.safety_level === "TOXIC").length;

  return (
    <AppScreen
      title={categoryName || t("search")}
      showBack
      backHref="/search"
      shellMode="stacked"
    >
      <div className="p-4">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary" aria-hidden="true">
            {categoryName.charAt(0)}
          </div>
          <h1 className="text-xl font-bold text-txt">{categoryName}</h1>
          <p className="text-sm text-txt-secondary">{t("foodCount", { count: foods.length })}</p>
          <div className="flex gap-2">
            {safeCount > 0 && <Badge variant="safe"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-safe" aria-hidden="true" />{safeCount} {t("safe")}</Badge>}
            {cautionCount > 0 && <Badge variant="caution"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-caution" aria-hidden="true" />{cautionCount} {t("caution")}</Badge>}
            {toxicCount > 0 && <Badge variant="toxic"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-toxic" aria-hidden="true" />{toxicCount} {t("toxic")}</Badge>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            : foods.map((food) => <FoodCard key={food.id} food={food} />)}
        </div>
      </div>
    </AppScreen>
  );
}
