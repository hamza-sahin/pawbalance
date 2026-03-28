import type { SafetyLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const iconMap: Record<SafetyLevel, string> = {
  SAFE: "✓",
  MODERATE: "⚠",
  TOXIC: "✕",
};

const variantMap: Record<SafetyLevel, "safe" | "caution" | "toxic"> = {
  SAFE: "safe",
  MODERATE: "caution",
  TOXIC: "toxic",
};

interface SafetyBadgeProps {
  level: SafetyLevel;
  className?: string;
}

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const t = useTranslations();
  const labels: Record<SafetyLevel, string> = {
    SAFE: t("safe"),
    MODERATE: t("caution"),
    TOXIC: t("toxic"),
  };

  return (
    <Badge variant={variantMap[level]} className={className}>
      {iconMap[level]} {labels[level]}
    </Badge>
  );
}
