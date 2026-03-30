import Link from "next/link";
import type { FoodCategory } from "@/lib/types";
import { localise } from "@/lib/types";
import { useLocale } from "next-intl";

interface CategoryGridProps {
  categories: FoodCategory[];
}

const categoryColors: Record<string, string> = {
  Fruit: "bg-safe/20 text-safe-text",
  Vegetable: "bg-safe/20 text-safe-text",
  Meat: "bg-toxic/20 text-toxic-text",
  Fish: "bg-info/20 text-info",
  Seafood: "bg-info/20 text-info",
  Dairy: "bg-caution/20 text-caution-text",
  Grain: "bg-secondary/20 text-secondary-dark",
  Bone: "bg-surface-variant text-txt-secondary",
  "Poisonous Plant": "bg-toxic/20 text-toxic-text",
};

function getCategoryColor(nameEn: string): string {
  return categoryColors[nameEn] ?? "bg-primary/10 text-primary-dark";
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((cat) => {
        const name = localise(cat, "name", locale);
        const colorClass = getCategoryColor(cat.name_en);
        return (
          <Link
            key={cat.id}
            href={`/search/category?name=${encodeURIComponent(cat.name_en)}`}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-4 transition-all duration-150 ease-out hover:bg-surface-variant active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${colorClass}`} aria-hidden="true">
              {cat.name_en.charAt(0)}
            </div>
            <span className="text-center text-xs font-medium text-txt-secondary">
              {name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
