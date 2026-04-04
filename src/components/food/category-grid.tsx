import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { FoodCategory } from "@/lib/types";
import { localise } from "@/lib/types";
import { Icons } from "@/components/ui/icon";
import { getCategoryStyle } from "@/lib/constants";

interface CategoryGridProps {
  categories: FoodCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((cat) => {
        const name = localise(cat, "name", locale);
        const style = getCategoryStyle(cat.name_en);
        const Icon = Icons[style.icon];
        return (
          <Link
            key={cat.id}
            href={`/search/category?name=${encodeURIComponent(cat.name_en)}`}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-4 transition-all duration-150 ease-out hover:bg-surface-variant active:scale-95 active:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.bg}`}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5 text-txt-secondary" />
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-txt">
                {name}
              </span>
              <span className="text-[10px] text-txt-tertiary">
                {t("foodCount", { count: cat.food_count })}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
