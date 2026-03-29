"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFoodsByCategory } from "@/hooks/use-food-search";
import { FoodCard } from "@/components/food/food-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

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
    <div className="p-4">
      <Link href="/search" aria-label={t("back")} className="mb-4 min-h-[44px] inline-flex items-center text-txt-secondary hover:text-txt">
        <Icons.arrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />{t("back")}
      </Link>

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
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          : foods.map((food) => <FoodCard key={food.id} food={food} />)}
      </div>
    </div>
  );
}
