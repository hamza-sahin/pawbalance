"use client";

import { BCS_DESCRIPTIONS, getBcsCategory } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface BCSSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function BCSSlider({ value, onChange }: BCSSliderProps) {
  const t = useTranslations();
  const bcs = BCS_DESCRIPTIONS[value];
  const category = getBcsCategory(value);

  const categoryColors = {
    underweight: "text-caution-text bg-caution-bg",
    healthy: "text-safe-text bg-safe-bg",
    overweight: "text-toxic-text bg-toxic-bg",
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-txt-secondary">
        {t("bodyConditionScore")}
      </label>
      <p className="text-xs text-txt-tertiary">{t("bcsTitle")}</p>
      <input
        type="range"
        min={1}
        max={9}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
        aria-label={t("bodyConditionScore")}
        aria-valuetext={bcs ? t("bcsScore", { score: value }) + " - " + bcs.label : undefined}
      />
      <div className="flex justify-between text-xs text-txt-tertiary">
        <span>{"1 " + t("bcsThin")}</span>
        <span>{"5 " + t("bcsIdeal")}</span>
        <span>{"9 " + t("bcsObese")}</span>
      </div>
      {bcs && (
        <div
          className={`flex items-center gap-2 rounded-button px-3 py-2 text-sm ${categoryColors[category]}`}
        >
          <span className="font-bold">{t("bcsScore", { score: bcs.score })}</span>
          <span className="font-semibold">{bcs.label}</span>
        </div>
      )}
      {bcs && (
        <p className="text-xs text-txt-secondary">{bcs.description}</p>
      )}
    </div>
  );
}
