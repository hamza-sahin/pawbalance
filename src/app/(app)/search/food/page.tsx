"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useFoodDetail } from "@/hooks/use-food-search";
import { useAIFoodLookup } from "@/hooks/use-ai-food-lookup";
import { usePetStore } from "@/store/pet-store";
import { SafetyBadge } from "@/components/food/safety-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScatteredPaws } from "@/components/recipe/scattered-paws";
import { NUTRITION_TIPS } from "@/lib/constants";
import { localise, splitBullets } from "@/lib/types";
import type { AIFoodResult, AIFoodPersonalized } from "@/lib/types";
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

function AILoadingView({ query, statusText }: { query: string; statusText: string | null }) {
  const t = useTranslations();
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const tipsRef = useRef<string[]>([]);

  useEffect(() => {
    const shuffled = [...NUTRITION_TIPS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    tipsRef.current = shuffled;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % NUTRITION_TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentTipKey = tipsRef.current[tipIndex] ?? NUTRITION_TIPS[0];

  const phase = statusText === "checking_database" ? 1 : 0;

  return (
    <div className="relative min-h-[350px]">
      <ScatteredPaws />

      <div className="relative z-[1]">
        {/* Search query display */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icons.sparkles className="h-7 w-7 text-primary motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-[15px] font-semibold text-txt">
            {t("aiSearchingFor", { query })}
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex flex-col gap-2">
          <div className={`flex items-center gap-2.5 rounded-[12px] border p-3 transition-all duration-400 ${
            phase >= 1
              ? "border-safe/20 bg-safe/5"
              : "border-primary/20 bg-primary/5"
          }`}>
            {phase >= 1 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-safe text-[11px] text-white">✓</span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" />
              </span>
            )}
            <span className={`text-sm font-medium ${phase >= 1 ? "text-safe" : "text-primary"}`}>
              {t("aiAnalyzing")}
            </span>
          </div>

          <div className={`flex items-center gap-2.5 rounded-[12px] border p-3 transition-all duration-400 ${
            phase >= 1
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-surface"
          }`}>
            {phase >= 1 ? (
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-border" />
              </span>
            )}
            <span className={`text-sm font-medium ${phase >= 1 ? "text-primary" : "text-txt-tertiary"}`}>
              {t("aiCheckingDatabase")}
            </span>
          </div>
        </div>

        {/* Tip card */}
        <div
          className="rounded-[14px] border border-border bg-surface p-4 text-center shadow-sm transition-opacity duration-400"
          style={{ opacity: tipVisible ? 1 : 0 }}
        >
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("didYouKnow")}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-txt-secondary">
            {t(`tips.${currentTipKey}`)}
          </p>
        </div>

        {/* Dot indicators */}
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                tipIndex % 3 === i ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>
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

function PersonalizedSection({ personalized }: { personalized: AIFoodPersonalized }) {
  const t = useTranslations();

  const pet = usePetStore((s) =>
    s.pets.find((p) => p.name === personalized.pet_name) ?? null,
  );

  return (
    <section className="rounded-card border border-primary/20 bg-primary/5 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
        {pet?.avatar_url ? (
          <img
            src={pet.avatar_url}
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

  // Fetch on mount — skip if already loaded from store
  useEffect(() => {
    if (isAI && aiQuery) {
      if (aiStatus === "idle" || (aiResult && aiQuery !== aiResult.name)) {
        lookup(aiQuery, locale);
      }
    } else if (id) {
      fetchFood(id);
    }
  }, [isAI, id, aiQuery, locale, fetchFood, lookup, aiStatus, aiResult]);

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
        <AILoadingView query={aiQuery} statusText={statusText} />
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
            onClick={() => lookup(aiQuery, locale)}
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

  // AI path: no result yet (e.g. missing query param) — show skeleton
  if (isAI && !aiResult) {
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
    <div className="p-4 pb-6">
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

        {/* Personalized sections — AI only, one per pet */}
        {isAI && aiResult?.personalized && aiResult.personalized.map((p, i) => (
          <PersonalizedSection key={p.pet_name ?? i} personalized={p} />
        ))}
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
