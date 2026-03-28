"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useFoodDetail } from "@/hooks/use-food-search";
import { SafetyBadge } from "@/components/food/safety-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { localise, splitBullets } from "@/lib/types";
import { getCategoryIcon } from "@/lib/constants";

export default function FoodDetailClient() {
  const t = useTranslations();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { food, isLoading, fetchFood } = useFoodDetail();

  useEffect(() => {
    fetchFood(id);
  }, [id, fetchFood]);

  if (isLoading || !food) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const name = localise(food, "name", locale);
  const category = localise(food, "category", locale);
  const dangerousParts = localise(food, "dangerous_parts", locale);
  const preparation = localise(food, "preparation", locale);
  const benefits = splitBullets(localise(food, "benefits", locale));
  const warnings = splitBullets(localise(food, "warnings", locale));
  const icon = getCategoryIcon(food.category_en);

  return (
    <div className="p-4">
      <Link href="/search" className="mb-4 inline-block text-txt-secondary hover:text-txt">
        ←
      </Link>

      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="text-5xl">{icon}</span>
        <h1 className="text-2xl font-bold text-txt">{name}</h1>
        <SafetyBadge level={food.safety_level} />
        <p className="text-sm text-txt-secondary">
          {icon} {category}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {dangerousParts && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-toxic">
              🚫 {t("dangerousParts")}
            </h2>
            <p className="text-sm text-txt-secondary">{dangerousParts}</p>
          </section>
        )}

        {preparation && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-caution">
              🍳 {t("preparation")}
            </h2>
            <p className="text-sm text-txt-secondary">{preparation}</p>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-warning">
              ⚠️ {t("warnings")}
            </h2>
            <ul className="flex flex-col gap-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-txt-secondary">• {w}</li>
              ))}
            </ul>
          </section>
        )}

        {benefits.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-success">
              💚 {t("benefits")}
            </h2>
            <ul className="flex flex-col gap-1">
              {benefits.map((b, i) => (
                <li key={i} className="text-sm text-txt-secondary">• {b}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
