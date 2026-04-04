"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useFoodDetail } from "@/hooks/use-food-search";
import { SafetyBadge } from "@/components/food/safety-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { localise, splitBullets } from "@/lib/types";
import { Icons } from "@/components/ui/icon";
import { AddToRecipeSheet } from "@/components/food/add-to-recipe-sheet";

export default function FoodDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { food, isLoading, fetchFood } = useFoodDetail();
  const [showRecipeSheet, setShowRecipeSheet] = useState(false);

  useEffect(() => {
    if (id) fetchFood(id);
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
  return (
    <div className="p-4">
      <Link href="/search" aria-label="Back" className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg">
        <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>

      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary" aria-hidden="true">
          {food.category_en.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-txt">{name}</h1>
        <SafetyBadge level={food.safety_level} />
        <p className="text-sm text-txt-secondary">
          {category}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {dangerousParts && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-toxic">
              <Icons.dangerousParts className="h-5 w-5" aria-hidden="true" /> {t("dangerousParts")}
            </h2>
            <p className="text-sm text-txt-secondary">{dangerousParts}</p>
          </section>
        )}

        {preparation && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-caution">
              <Icons.preparation className="h-5 w-5" aria-hidden="true" /> {t("preparation")}
            </h2>
            <p className="text-sm text-txt-secondary">{preparation}</p>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-warning">
              <Icons.warnings className="h-5 w-5" aria-hidden="true" /> {t("warnings")}
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
              <Icons.benefits className="h-5 w-5" aria-hidden="true" /> {t("benefits")}
            </h2>
            <ul className="flex flex-col gap-1">
              {benefits.map((b, i) => (
                <li key={i} className="text-sm text-txt-secondary">• {b}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setShowRecipeSheet(true)}
          className="flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-button bg-primary-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icons.plus className="h-4 w-4" aria-hidden="true" />
          {t("addToRecipe")}
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: name, text: `${name} - ${t(food.safety_level === "SAFE" ? "safe" : food.safety_level === "MODERATE" ? "caution" : "toxic")}` });
            }
          }}
          aria-label={t("share")}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-button border border-border bg-surface transition-all duration-150 ease-out active:scale-90 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icons.share className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
        </button>
      </div>

      <AddToRecipeSheet
        open={showRecipeSheet}
        onClose={() => setShowRecipeSheet(false)}
        foodName={name}
        preparation={preparation ?? undefined}
      />
    </div>
  );
}
