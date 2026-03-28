"use client";

import { ACTIVITY_LEVELS } from "@/lib/constants";
import type { ActivityLevel } from "@/lib/types";
import { useTranslations } from "next-intl";

interface ActivityLevelSelectorProps {
  value: ActivityLevel;
  onChange: (value: ActivityLevel) => void;
}

export function ActivityLevelSelector({
  value,
  onChange,
}: ActivityLevelSelectorProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-txt-secondary">
        {t("activityLevel")}
      </label>
      <div className="flex flex-col gap-2">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level.key}
            type="button"
            onClick={() => onChange(level.key as ActivityLevel)}
            className={`flex items-center gap-3 rounded-card border p-3 text-left transition-colors ${
              value === level.key
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-surface-variant"
            }`}
          >
            <div className="flex-1">
              <p className="font-medium text-txt">{level.label}</p>
              <p className="text-sm text-txt-secondary">{level.description}</p>
            </div>
            {value === level.key && (
              <span className="text-primary">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
