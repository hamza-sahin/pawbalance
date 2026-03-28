"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFoodsByCategory } from "@/hooks/use-food-search";
import { FoodCard } from "@/components/food/food-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryIcon } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function CategoryPage() {
  const t = useTranslations();
  const { category } = useParams<{ category: string }>();
  const categoryName = decodeURIComponent(category);
  const { foods, isLoading, fetchByCategory } = useFoodsByCategory();

  useEffect(() => {
    fetchByCategory(categoryName);
  }, [categoryName, fetchByCategory]);

  const icon = getCategoryIcon(categoryName);
  const safeCount = foods.filter((f) => f.safety_level === "SAFE").length;
  const cautionCount = foods.filter((f) => f.safety_level === "MODERATE").length;
  const toxicCount = foods.filter((f) => f.safety_level === "TOXIC").length;

  return (
    <div className="p-4">
      <Link href="/search" className="mb-4 inline-block text-txt-secondary hover:text-txt">
        ← Back
      </Link>

      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="text-5xl">{icon}</span>
        <h1 className="text-xl font-bold text-txt">{categoryName}</h1>
        <p className="text-sm text-txt-secondary">{foods.length} foods</p>
        <div className="flex gap-2">
          {safeCount > 0 && <Badge variant="safe">● {safeCount} {t("safe")}</Badge>}
          {cautionCount > 0 && <Badge variant="caution">● {cautionCount} {t("caution")}</Badge>}
          {toxicCount > 0 && <Badge variant="toxic">● {toxicCount} {t("toxic")}</Badge>}
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
