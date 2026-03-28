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
      <p className="text-xs text-txt-tertiary">Rate your dog&apos;s body condition (1-9)</p>
      <input
        type="range"
        min={1}
        max={9}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
      <div className="flex justify-between text-xs text-txt-tertiary">
        <span>1 Thin</span>
        <span>5 Ideal</span>
        <span>9 Obese</span>
      </div>
      {bcs && (
        <div
          className={`flex items-center gap-2 rounded-button px-3 py-2 text-sm ${categoryColors[category]}`}
        >
          <span className="font-bold">Score {bcs.score}</span>
          <span className="font-semibold">{bcs.label}</span>
        </div>
      )}
      {bcs && (
        <p className="text-xs text-txt-secondary">{bcs.description}</p>
      )}
    </div>
  );
}
