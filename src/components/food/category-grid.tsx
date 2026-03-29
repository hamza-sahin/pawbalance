import Link from "next/link";
import type { FoodCategory } from "@/lib/types";
import { localise } from "@/lib/types";
import { useLocale } from "next-intl";

interface CategoryGridProps {
  categories: (FoodCategory & { icon: string })[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search/category?name=${encodeURIComponent(cat.name_en)}`}
          className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-4 shadow-sm transition-colors hover:bg-surface-variant"
        >
          <span className="text-3xl">{cat.icon}</span>
          <span className="text-center text-xs font-medium text-txt-secondary">
            {localise(cat, "name", locale)}
          </span>
        </Link>
      ))}
    </div>
  );
}
