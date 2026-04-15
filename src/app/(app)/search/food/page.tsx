"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useFoodDetail } from "@/hooks/use-food-search";
import { useAIFoodLookup } from "@/hooks/use-ai-food-lookup";
import { usePetStore } from "@/store/pet-store";
import { SafetyBadge } from "@/components/food/safety-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { localise, splitBullets } from "@/lib/types";
import type { AIFoodResult } from "@/lib/types";
import { Icons } from "@/components/ui/icon";
import { AddToRecipeSheet } from "@/components/food/add-to-recipe-sheet";

function FoodDetailSkeleton() {
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

function AIBadge() {
  const t = useTranslations();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      <Icons.sparkles className="h-3 w-3" aria-hidden="true" />
      {t("aiGeneratedBadge")}
    </span>
  );
}

function PersonalizedSection({ personalized }: { personalized: AIFoodResult["personalized"] }) {
  const t = useTranslations();
  if (!personalized) return null;

  const selectedPet = usePetStore((s) => {
    const id = s.selectedPetId;
    return s.pets.find((p) => p.id === id) ?? null;
  });

  return (
    <section className="rounded-card border border-primary/20 bg-primary/5 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
        {selectedPet?.avatar_url ? (
          <img
            src={selectedPet.avatar_url}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <Icons.paw className="h-5 w-5" aria-hidden="true" />
        )}
        {t("personalizedFor", { petName: personalized.pet_name })}
      </h2>

      <div className="flex flex-col gap-3">
        {/* Pet-specific advice */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
            {t("petSpecificAdvice")}
          </p>
          <p className="text-sm text-txt-secondary">
            {personalized.pet_specific_advice}
          </p>
        </div>

        {/* Portion guidance */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
            {t("portionGuidance")}
          </p>
          <p className="text-sm text-txt-secondary">
            {personalized.portion_guidance}
          </p>
        </div>

        {/* Risk factors */}
        {personalized.risk_factors.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary/70">
              {t("riskFactors")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {personalized.risk_factors.map((factor, i) => (
                <span
                  key={i}
                  className="rounded-full bg-caution/10 px-2.5 py-0.5 text-xs font-medium text-caution"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function FoodDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Detect mode: AI vs DB
  const isAI = searchParams.get("ai") === "true";
  const id = searchParams.get("id") ?? "";
  const aiQuery = searchParams.get("query") ?? "";
  const aiPetId = searchParams.get("petId") ?? null;

  // DB path
  const { food, isLoading: dbLoading, fetchFood } = useFoodDetail();

  // AI path
  const {
    status: aiStatus,
    result: aiResult,
    error: aiError,
    statusText,
    lookup,
    abort,
  } = useAIFoodLookup();

  const [showRecipeSheet, setShowRecipeSheet] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  // Fetch on mount
  useEffect(() => {
    if (isAI && aiQuery) {
      lookup(aiQuery, aiPetId, locale);
    } else if (id) {
      fetchFood(id);
    }
    return () => {
      if (isAI) abort();
    };
  }, [isAI, id, aiQuery, aiPetId, locale, fetchFood, lookup, abort]);

  // Loading state
  if (isAI && aiStatus === "loading") {
    return (
      <div className="p-4">
        <Link
          href="/search"
          aria-label="Back"
          className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
        >
          <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <FoodDetailSkeleton />
        {statusText && (
          <p className="mt-4 text-center text-sm text-txt-secondary motion-safe:animate-pulse">
            {statusText === "checking_database"
              ? t("aiCheckingDatabase")
              : t("aiAnalyzing")}
          </p>
        )}
      </div>
    );
  }

  // AI error state
  if (isAI && aiStatus === "error") {
    return (
      <div className="p-4">
        <Link
          href="/search"
          aria-label="Back"
          className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
        >
          <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex flex-col items-center gap-3 py-12">
          <Icons.caution className="h-10 w-10 text-caution" aria-hidden="true" />
          <p className="text-center text-sm text-txt-secondary">
            {aiError ?? t("aiError")}
          </p>
          <button
            onClick={() => lookup(aiQuery, aiPetId, locale)}
            className="min-h-[44px] rounded-button bg-primary-btn px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  // DB loading
  if (!isAI && (dbLoading || !food)) {
    return <FoodDetailSkeleton />;
  }

  // Derive display values based on mode
  const name = isAI ? aiResult!.name : localise(food!, "name", locale);
  const category = isAI
    ? aiResult!.category
    : localise(food!, "category", locale);
  const safetyLevel = isAI ? aiResult!.safety_level : food!.safety_level;
  const dangerousParts = isAI
    ? aiResult!.dangerous_parts
    : localise(food!, "dangerous_parts", locale);
  const preparation = isAI
    ? aiResult!.preparation
    : localise(food!, "preparation", locale);
  const benefits = splitBullets(
    isAI ? aiResult!.benefits : localise(food!, "benefits", locale),
  );
  const warnings = splitBullets(
    isAI ? aiResult!.warnings : localise(food!, "warnings", locale),
  );
  const categoryInitial = isAI
    ? aiResult!.category.charAt(0)
    : food!.category_en.charAt(0);

  return (
    <div className="p-4">
      <Link
        href="/search"
        aria-label="Back"
        className="mb-4 inline-flex min-h-[44px] min-w-[44px] items-center text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg"
      >
        <Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>

      <div className="mb-6 flex flex-col items-center gap-2">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary"
          aria-hidden="true"
        >
          {categoryInitial}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-txt">{name}</h1>
          {isAI && <AIBadge />}
        </div>
        <SafetyBadge level={safetyLevel} />
        <p className="text-sm text-txt-secondary">{category}</p>
      </div>

      <div className="flex flex-col gap-4">
        {dangerousParts && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-toxic">
              <Icons.dangerousParts
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("dangerousParts")}
            </h2>
            <p className="text-sm text-txt-secondary">{dangerousParts}</p>
          </section>
        )}

        {preparation && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-caution">
              <Icons.preparation
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("preparation")}
            </h2>
            <p className="text-sm text-txt-secondary">{preparation}</p>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-warning">
              <Icons.warnings
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("warnings")}
            </h2>
            <ul className="flex flex-col gap-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-txt-secondary">
                  • {w}
                </li>
              ))}
            </ul>
          </section>
        )}

        {benefits.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-success">
              <Icons.benefits
                className="h-5 w-5"
                aria-hidden="true"
              />{" "}
              {t("benefits")}
            </h2>
            <ul className="flex flex-col gap-1">
              {benefits.map((b, i) => (
                <li key={i} className="text-sm text-txt-secondary">
                  • {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Personalized section — AI only */}
        {isAI && aiResult?.personalized && (
          <PersonalizedSection personalized={aiResult.personalized} />
        )}
      </div>

      {/* Action bar */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setShowRecipeSheet(true)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-button bg-primary-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icons.plus className="h-4 w-4" aria-hidden="true" />
          {t("addToRecipe")}
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: name,
                text: `${name} - ${t(safetyLevel === "SAFE" ? "safe" : safetyLevel === "MODERATE" ? "caution" : "toxic")}`,
              });
            }
          }}
          aria-label={t("share")}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-button border border-border bg-surface transition-all duration-150 ease-out active:scale-90 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icons.share
            className="h-5 w-5 text-txt-secondary"
            aria-hidden="true"
          />
        </button>
      </div>

      {addedMessage && (
        <div className="mt-3 rounded-button bg-safe/10 px-4 py-2.5 text-center text-sm font-medium text-safe">
          {addedMessage}
        </div>
      )}

      <AddToRecipeSheet
        open={showRecipeSheet}
        onClose={() => setShowRecipeSheet(false)}
        foodName={name}
        preparation={
          isAI
            ? aiResult?.preparation ?? undefined
            : localise(food!, "preparation", locale) || undefined
        }
        onAdded={(recipeName) => {
          setAddedMessage(
            t("addedToRecipe", { food: name, recipe: recipeName }),
          );
          setTimeout(() => setAddedMessage(""), 3000);
        }}
      />
    </div>
  );
}
