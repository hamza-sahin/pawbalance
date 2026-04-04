"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldAlert,
  Tag,
  CheckCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import type { AnalysisResult, AnalysisSafety } from "@/lib/types";

const SAFETY_CONFIG: Record<
  AnalysisSafety,
  { bg: string; border: string; text: string; icon: typeof ShieldAlert; label: string }
> = {
  safe: {
    bg: "bg-safe/10",
    border: "border-safe/25",
    text: "text-safe",
    icon: CheckCircle,
    label: "safe",
  },
  moderate: {
    bg: "bg-caution/10",
    border: "border-caution/25",
    text: "text-caution",
    icon: AlertTriangle,
    label: "caution",
  },
  toxic: {
    bg: "bg-toxic/10",
    border: "border-toxic/25",
    text: "text-toxic",
    icon: ShieldAlert,
    label: "toxic",
  },
};

const DOT_COLORS: Record<AnalysisSafety, string> = {
  safe: "bg-safe",
  moderate: "bg-caution",
  toxic: "bg-toxic",
};

interface AnalysisReportProps {
  result: AnalysisResult;
  onAddSuggestion?: (suggestion: string) => void;
}

export function AnalysisReport({ result, onAddSuggestion }: AnalysisReportProps) {
  const t = useTranslations();
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());
  const config = SAFETY_CONFIG[result.overall_safety];
  const Icon = config.icon;

  return (
    <div>
      {/* Overall safety banner */}
      <div
        className={`mb-4 rounded-[14px] border p-4 text-center ${config.bg} ${config.border}`}
      >
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <Icon className={`h-4 w-4 ${config.text}`} />
          <p
            className={`text-sm font-bold uppercase tracking-wide ${config.text}`}
          >
            {t(config.label)}
          </p>
        </div>
        {result.safety_alerts.length > 0 && (
          <p className="text-[13px] text-txt-secondary">
            {result.safety_alerts.length} alert
            {result.safety_alerts.length > 1 ? "s" : ""}
            {result.preparation_warnings.length > 0 &&
              `, ${result.preparation_warnings.length} preparation warning${result.preparation_warnings.length > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Ingredients breakdown */}
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-txt-secondary">
        {t("ingredients")}
      </p>
      <Card className="mb-4">
        {result.ingredients.map((ing, i) => (
          <div
            key={i}
            className={`flex min-h-[56px] items-center gap-2.5 px-3.5 ${
              ing.safety_level === "toxic" ? "bg-toxic/5" : ""
            } ${i < result.ingredients.length - 1 ? "border-b border-border" : ""}`}
          >
            <div
              className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_COLORS[ing.safety_level]}`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-txt">{ing.name}</p>
              <p
                className={`text-xs ${
                  ing.safety_level === "safe"
                    ? "text-safe"
                    : ing.safety_level === "moderate"
                      ? "text-caution"
                      : "text-toxic"
                }`}
              >
                {ing.notes}
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* Safety Alerts */}
      {result.safety_alerts.length > 0 && (
        <div className="mb-3 rounded-xl border border-toxic/20 bg-toxic/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-toxic">
            <ShieldAlert className="h-4 w-4" />
            {t("safetyAlerts")}
          </p>
          {result.safety_alerts.map((alert, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-txt">
              {alert}
            </p>
          ))}
        </div>
      )}

      {/* Preparation Warnings */}
      {result.preparation_warnings.length > 0 && (
        <div className="mb-3 rounded-xl border border-caution/20 bg-caution/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-caution">
            <Tag className="h-4 w-4" />
            {t("preparationTips")}
          </p>
          {result.preparation_warnings.map((warning, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-txt">
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Benefits */}
      {result.benefits_summary.length > 0 && (
        <div className="mb-3 rounded-xl border border-safe/20 bg-safe/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-safe">
            <CheckCircle className="h-4 w-4" />
            {t("benefitsSummary")}
          </p>
          <ul className="flex flex-col gap-2">
            {result.benefits_summary.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] leading-relaxed"
              >
                <span className="mt-0.5 text-txt">•</span>
                <span className="flex-1 text-txt">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
            <Lightbulb className="h-4 w-4" />
            {t("suggestionsSummary")}
          </p>
          <ul className="flex flex-col gap-2">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 text-[13px] leading-relaxed ${addedSuggestions.has(i) ? "opacity-50" : ""}`}
              >
                <span className="mt-0.5 text-txt">•</span>
                <span className="flex-1 text-txt">{s}</span>
                {onAddSuggestion && !addedSuggestions.has(i) && (
                  <button
                    onClick={() => {
                      onAddSuggestion(s);
                      setAddedSuggestions((prev) => new Set(prev).add(i));
                    }}
                    className="mt-0.5 shrink-0 rounded-md border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary transition-all duration-150 ease-out active:scale-95 active:bg-primary/5"
                  >
                    + {t("addSuggestion")}
                  </button>
                )}
                {addedSuggestions.has(i) && (
                  <Icons.check className="mt-1 h-3.5 w-3.5 shrink-0 text-safe" aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
