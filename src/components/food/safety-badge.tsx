import type { SafetyLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";
import { useTranslations } from "next-intl";

const iconMap: Record<SafetyLevel, React.ComponentType<{ className?: string }>> = {
  SAFE: Icons.safe,
  MODERATE: Icons.caution,
  TOXIC: Icons.toxic,
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
  const Icon = iconMap[level];

  return (
    <Badge variant={variantMap[level]} className={className}>
      <Icon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
      {labels[level]}
    </Badge>
  );
}
