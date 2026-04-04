"use client";

import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const STEPS = ["scanStep1", "scanStep2", "scanStep3"] as const;

export default function ScanPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
      <h1 className="mb-6 text-center text-lg font-bold text-txt">{t("scannerTitle")}</h1>

      {/* Scan preview card */}
      <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface p-6">
        {/* Viewfinder */}
        <div className="relative mb-4 rounded-xl bg-surface-variant p-8">
          {/* Corner brackets */}
          <div className="absolute left-2 top-2 h-5 w-5 rounded-tl border-l-[3px] border-t-[3px] border-primary" />
          <div className="absolute right-2 top-2 h-5 w-5 rounded-tr border-r-[3px] border-t-[3px] border-primary" />
          <div className="absolute bottom-2 left-2 h-5 w-5 rounded-bl border-b-[3px] border-l-[3px] border-primary" />
          <div className="absolute bottom-2 right-2 h-5 w-5 rounded-br border-b-[3px] border-r-[3px] border-primary" />
          {/* Placeholder label lines */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-1.5 w-[80%] rounded-full bg-border" />
            <div className="h-1.5 w-[60%] rounded-full bg-border" />
            <div className="h-1.5 w-[90%] rounded-full bg-border" />
            <div className="h-1.5 w-[50%] rounded-full bg-border" />
            <div className="h-1.5 w-[75%] rounded-full bg-border" />
          </div>
        </div>
        <h2 className="text-center text-base font-semibold text-txt">{t("scanFoodLabels")}</h2>
        <p className="mt-1 text-center text-sm text-txt-secondary">{t("scanDescription")}</p>
      </div>

      {/* How it works */}
      <div className="mb-4 rounded-card border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-txt">{t("howItWorks")}</h3>
        <div className="flex flex-col gap-3">
          {STEPS.map((stepKey, i) => (
            <div key={stepKey} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-txt">{t(stepKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary-dark p-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Icons.layers className="h-4 w-4 text-white" aria-hidden="true" />
          <span className="font-bold text-white">{t("unlockScanner")}</span>
        </div>
        <p className="mb-4 text-xs text-white/75">{t("includedWithPremium")}</p>
        <button className="w-full rounded-button bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
          {t("upgradeToPremium")}
        </button>
      </div>
    </div>
  );
}
