"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const PRESET_METHODS = [
  "Raw",
  "Boiled",
  "Cooked",
  "Grilled",
  "Steamed",
] as const;

const METHOD_KEYS: Record<string, string> = {
  Raw: "preparationRaw",
  Boiled: "preparationBoiled",
  Cooked: "preparationCooked",
  Grilled: "preparationGrilled",
  Steamed: "preparationSteamed",
};

interface PreparationChipsProps {
  value: string;
  onChange: (value: string) => void;
}

export function PreparationChips({ value, onChange }: PreparationChipsProps) {
  const t = useTranslations();
  const [showCustom, setShowCustom] = useState(false);
  const isPreset = PRESET_METHODS.includes(value as any);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-txt-secondary">
        {t("preparationMethod")}
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            className={`min-h-[36px] cursor-pointer touch-manipulation rounded-[10px] border px-3 text-[13px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              value === method
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-txt-secondary"
            }`}
            onClick={() => {
              setShowCustom(false);
              onChange(method);
            }}
          >
            {t(METHOD_KEYS[method])}
          </button>
        ))}
        <button
          type="button"
          className={`min-h-[36px] cursor-pointer touch-manipulation rounded-[10px] border border-dashed px-3 text-[13px] font-medium transition-colors duration-150 ${
            showCustom || (!isPreset && value)
              ? "border-primary bg-primary text-white"
              : "border-border-secondary text-txt-secondary"
          }`}
          onClick={() => {
            setShowCustom(true);
            if (isPreset) onChange("");
          }}
        >
          {t("preparationCustom")}
        </button>
      </div>
      {showCustom && (
        <Input
          className="mt-2"
          placeholder={t("preparationMethod")}
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
