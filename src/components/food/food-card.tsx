import Link from "next/link";
import type { Food } from "@/lib/types";
import { localise } from "@/lib/types";
import { SafetyBadge } from "./safety-badge";
import { getCategoryIcon } from "@/lib/constants";
import { useLocale } from "next-intl";

interface FoodCardProps {
  food: Food;
}

const borderColorMap = {
  SAFE: "border-l-safe",
  MODERATE: "border-l-caution",
  TOXIC: "border-l-toxic",
};

export function FoodCard({ food }: FoodCardProps) {
  const locale = useLocale();
  const name = localise(food, "name", locale);
  const category = localise(food, "category", locale);
  const icon = getCategoryIcon(food.category_en);

  return (
    <Link
      href={`/search/food/${food.id}`}
      className={`flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-variant border-l-4 ${borderColorMap[food.safety_level]}`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-txt truncate">{name}</p>
        <p className="text-sm text-txt-secondary">{category}</p>
      </div>
      <SafetyBadge level={food.safety_level} />
      <span className="text-txt-tertiary">›</span>
    </Link>
  );
}
