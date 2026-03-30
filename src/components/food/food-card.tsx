import Link from "next/link";
import type { Food } from "@/lib/types";
import { localise } from "@/lib/types";
import { SafetyBadge } from "./safety-badge";
import { Icons } from "@/components/ui/icon";
import { useLocale } from "next-intl";

const borderColorMap: Record<string, string> = {
  SAFE: "border-l-safe",
  MODERATE: "border-l-caution",
  TOXIC: "border-l-toxic",
};

export function FoodCard({ food }: { food: Food }) {
  const locale = useLocale();
  const name = localise(food, "name", locale);
  const category = localise(food, "category", locale);

  return (
    <Link
      href={`/search/food?id=${food.id}`}
      className={`flex items-center gap-3 rounded-card border border-border border-l-4 ${borderColorMap[food.safety_level] ?? ""} bg-surface p-3 transition-all duration-150 ease-out hover:bg-surface-variant active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-sm font-semibold text-primary">
        {category.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-txt">{name}</p>
        <p className="text-xs text-txt-secondary">{category}</p>
      </div>
      <SafetyBadge level={food.safety_level} />
      <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
    </Link>
  );
}
