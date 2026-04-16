"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ScatteredPaws } from "@/components/recipe/scattered-paws";
import { CheckmarkCelebration } from "@/components/recipe/checkmark-celebration";
import { AnalysisReport } from "@/components/recipe/analysis-report";
import { NUTRITION_TIPS } from "@/lib/constants";
import type { IngredientProgress } from "@/lib/types";
import type { AnalysisResult } from "@/lib/types";

interface AnalysisProgressProps {
  recipeName: string;
  ingredients: IngredientProgress[];
  result: AnalysisResult | null;
  status: "pending" | "completed" | "failed" | "idle";
}

type Phase = "progress" | "checkmark" | "report";

const CHIP_STYLES = {
  pending: "bg-[#F5F3F0] text-txt-tertiary border-border",
  checking: "bg-primary/10 text-primary border-primary/20 motion-safe:animate-pulse",
  safe: "bg-safe/10 text-safe border-safe/20",
  moderate: "bg-caution/10 text-caution border-caution/20",
  toxic: "bg-toxic/10 text-toxic border-toxic/20",
} as const;

const CHIP_ICONS: Record<string, string> = {
  pending: "",
  checking: "↻",
  safe: "✓",
  moderate: "⚠",
  toxic: "✕",
};

function getChipState(ing: IngredientProgress): keyof typeof CHIP_STYLES {
  if (ing.status === "pending") return "pending";
  if (ing.status === "checking") return "checking";
  if (ing.status === "done") return (ing.safety as "safe" | "moderate" | "toxic") ?? "safe";
  return "pending";
}

function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function AnalysisProgress({
  recipeName,
  ingredients,
  result,
  status,
}: AnalysisProgressProps) {
  const t = useTranslations();
  const [phase, setPhase] = useState<Phase>("progress");
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const tipsRef = useRef<string[]>([]);

  // Shuffle tips once on mount
  useEffect(() => {
    tipsRef.current = shuffleArray(NUTRITION_TIPS);
  }, []);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (phase !== "progress") return;
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % NUTRITION_TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  // Trigger checkmark when all ingredients done and result received
  useEffect(() => {
    if (
      status === "completed" &&
      result &&
      phase === "progress" &&
      ingredients.length > 0 &&
      ingredients.every((i) => i.status === "done")
    ) {
      const timer = setTimeout(() => setPhase("checkmark"), 600);
      return () => clearTimeout(timer);
    }
  }, [status, result, phase, ingredients]);

  const handleCelebrationComplete = useCallback(() => {
    setPhase("report");
  }, []);

  const doneCount = ingredients.filter((i) => i.status === "done").length;
  const totalCount = ingredients.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const currentTipKey = tipsRef.current[tipIndex] ?? NUTRITION_TIPS[0];

  if (phase === "report" && result) {
    return <AnalysisReport result={result} />;
  }

  return (
    <div className="relative min-h-[380px]">
      <ScatteredPaws
        className={`transition-opacity duration-500 ${phase === "checkmark" ? "opacity-0" : "opacity-100"}`}
      />

      {/* Progress phase */}
      {phase === "progress" && (
        <div className="relative z-[1]">
          {/* Determinate progress bar */}
          <div className="mb-4">
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${progressPct}%`,
                  transition: "width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
                }}
              />
            </div>
            <p className="text-center text-[13px] text-txt-secondary">
              {t("checkingIngredients", { count: totalCount })}
              {totalCount > 0 && ` (${doneCount}/${totalCount})`}
            </p>
          </div>

          {/* Ingredient chips */}
          <div className="mb-5 flex flex-wrap justify-center gap-1.5">
            {ingredients.map((ing) => {
              const state = getChipState(ing);
              const icon = CHIP_ICONS[state];
              return (
                <span
                  key={ing.id}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-400 ${CHIP_STYLES[state]}`}
                >
                  {icon && <span className="mr-1">{icon}</span>}
                  {ing.name}
                </span>
              );
            })}
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
      )}

      {/* Checkmark phase */}
      {phase === "checkmark" && (
        <CheckmarkCelebration onComplete={handleCelebrationComplete} />
      )}
    </div>
  );
}
