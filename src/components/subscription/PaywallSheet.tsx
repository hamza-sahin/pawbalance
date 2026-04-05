"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, ScanLine, Check } from "lucide-react";
import { usePurchases } from "@/hooks/use-purchases";
import { useSheetDrag } from "@/hooks/use-sheet-drag";
import type { AccessTier } from "@/lib/access";

interface PaywallSheetProps {
  /** Which tier triggered the paywall — determines pre-selection. */
  requiredTier: AccessTier;
  onDismiss: () => void;
}

type PlanKey = "basic" | "premium";
type Period = "monthly" | "annual";

const PRICES: Record<PlanKey, Record<Period, { amount: string; equivalent?: string }>> = {
  basic: {
    monthly: { amount: "$6.99" },
    annual: { amount: "$49.99", equivalent: "$4.17" },
  },
  premium: {
    monthly: { amount: "$9.99" },
    annual: { amount: "$79.99", equivalent: "$6.67" },
  },
};

const RECIPE_FEATURES = [
  "createRecipes",
  "aiAnalysis",
  "safetyAlerts",
  "personalizedDog",
] as const;

const SCANNER_FEATURES = [
  "scanLabels",
  "aiIngredientBreakdown",
  "createRecipes",
  "aiAnalysis",
] as const;

export function PaywallSheet({ requiredTier, onDismiss }: PaywallSheetProps) {
  const t = useTranslations();
  const { purchase, restore } = usePurchases();
  const defaultPlan: PlanKey = requiredTier === "premium" ? "premium" : "basic";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan);
  const [period, setPeriod] = useState<Period>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sheetRef, maximized, handlers: dragHandlers } = useSheetDrag({ onDismiss, disabled: isLoading });

  const isRecipeContext = requiredTier !== "premium";
  const features = isRecipeContext ? RECIPE_FEATURES : SCANNER_FEATURES;
  const price = PRICES[selectedPlan][period];

  const handlePurchase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await purchase(selectedPlan, period);
      if (success) onDismiss();
    } catch {
      setError(t("purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [purchase, selectedPlan, period, onDismiss, t]);

  const handleRestore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const restored = await restore();
      if (restored) onDismiss();
      else setError(t("purchaseFailed"));
    } catch {
      setError(t("purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [restore, onDismiss, t]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onDismiss(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 motion-safe:animate-fade-in" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        {...dragHandlers}
        className={`relative w-full max-w-md bg-surface p-5 shadow-xl motion-safe:animate-slide-up transition-[border-radius,max-height] duration-250 ease-out overflow-y-auto ${
          maximized
            ? "rounded-t-none max-h-[100dvh] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            : "rounded-t-[20px] max-h-[90dvh] pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:rounded-[20px]"
        }`}
        style={{ overscrollBehavior: "contain" }}
        role="dialog"
        aria-modal="true"
        aria-label={isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border md:hidden" />

        {/* Context icon */}
        <div className={`mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px] ${
          isRecipeContext
            ? "bg-gradient-to-br from-primary to-primary-dark"
            : "bg-gradient-to-br from-caution to-[#c49518]"
        }`}>
          {isRecipeContext
            ? <UtensilsCrossed className="h-5 w-5 text-white" />
            : <ScanLine className="h-5 w-5 text-white" />
          }
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-txt">
          {isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
        </h2>
        <p className="mb-3 text-center text-[13px] text-txt-secondary">
          {isRecipeContext ? t("unlockRecipesDesc") : t("unlockScannerDesc")}
        </p>

        {/* Trial badge */}
        <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-safe/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-primary">{t("freeTrialBadge")}</span>
        </div>

        {/* Period toggle */}
        <div className="mx-auto mb-3 flex w-fit gap-0.5 rounded-[10px] bg-canvas p-0.5">
          <button
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              period === "monthly" ? "bg-surface text-txt shadow-sm" : "text-txt-secondary"
            }`}
            onClick={() => setPeriod("monthly")}
          >
            {t("monthly")}
          </button>
          <button
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              period === "annual" ? "bg-surface text-txt shadow-sm" : "text-txt-secondary"
            }`}
            onClick={() => setPeriod("annual")}
          >
            {t("annual")} <span className="ml-1 rounded bg-caution px-1.5 py-px text-[9px] font-bold text-white">{t("savePct", { pct: "33" })}</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mb-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Choose a plan">
          {(["basic", "premium"] as const).map((plan) => {
            const selected = selectedPlan === plan;
            const p = PRICES[plan][period];
            const tag = plan === "basic" && isRecipeContext ? t("mostPopular")
              : plan === "premium" && !isRecipeContext ? t("bestValue")
              : null;

            return (
              <button
                key={plan}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => !isLoading && setSelectedPlan(plan)}
                className={`relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] p-3.5 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border"
                } ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {tag && (
                  <span className={`absolute -top-2 right-3 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase text-white ${
                    plan === "basic" ? "bg-primary" : "bg-caution"
                  }`}>
                    {tag}
                  </span>
                )}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-border"
                }`}>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-txt">{t(`${plan}Plan`)}</span>
                  <span className="block text-[11px] text-txt-secondary">{t(`${plan}PlanDesc`)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[17px] font-bold text-txt">{p.amount}</span>
                  <span className="block text-[11px] text-txt-secondary">{period === "monthly" ? t("perMonth") : t("perYear")}</span>
                  {p.equivalent && (
                    <span className="block text-[10px] text-txt-secondary">{t("perMonthEquiv", { price: p.equivalent })}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="mb-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-txt-secondary">{t("whatsIncluded")}</p>
          {features.map((key) => (
            <div key={key} className="flex items-center gap-2 py-1">
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-safe/10">
                <Check className="h-3 w-3 text-primary" />
              </span>
              <span className="text-[13px] text-txt">{t(key)}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={`${t("startFreeTrial")} — ${t(`${selectedPlan}Plan`)}`}
          className="relative mb-2 w-full cursor-pointer rounded-button bg-primary-btn py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
          ) : (
            t("startFreeTrial")
          )}
        </button>

        {/* Error */}
        {error && (
          <p role="alert" className="mb-2 text-center text-xs text-toxic">{error}</p>
        )}

        {/* Fine print */}
        <p className="text-center text-[11px] text-txt-tertiary">
          {t("afterTrial", { price: price.amount, period: period === "monthly" ? t("monthly").toLowerCase() : t("annual").toLowerCase() })}
        </p>
        <button
          onClick={handleRestore}
          disabled={isLoading}
          className="mt-1.5 block w-full cursor-pointer text-center text-xs font-medium text-txt-secondary"
        >
          {t("restorePurchase")}
        </button>
        <p className="mt-1 text-center text-[10px] text-txt-tertiary md:hidden">{t("swipeToClose")}</p>
      </div>
    </div>
  );
}
