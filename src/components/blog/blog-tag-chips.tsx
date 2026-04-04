"use client";

import { useTranslations } from "next-intl";
import { BLOG_TAGS } from "@/lib/types";
import type { BlogTag } from "@/lib/types";
import { Icons } from "@/components/ui/icon";

const TAG_I18N_MAP: Record<string, string> = {
  all: "tagAll",
  nutrition: "tagNutrition",
  dog: "tagDog",
  cat: "tagCat",
  health: "tagHealth",
  safety: "tagSafety",
  behavior: "tagBehavior",
  diet: "tagDiet",
};

interface BlogTagChipsProps {
  activeTags: BlogTag[];
  onToggle: (tag: BlogTag | "all") => void;
}

export function BlogTagChips({ activeTags, onToggle }: BlogTagChipsProps) {
  const t = useTranslations();
  const isAllActive = activeTags.length === 0;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent_100%)]">
      <button
        onClick={() => onToggle("all")}
        aria-pressed={isAllActive}
        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isAllActive
            ? "border-primary bg-primary text-white"
            : "border-border bg-surface text-txt-secondary hover:bg-surface-variant"
        }`}
      >
        {isAllActive && (
          <Icons.check className="mr-1 inline h-3 w-3" aria-hidden="true" />
        )}
        {t(TAG_I18N_MAP.all)}
      </button>
      {BLOG_TAGS.map((tag) => {
        const isActive = activeTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            aria-pressed={isActive}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-txt-secondary hover:bg-surface-variant"
            }`}
          >
            {isActive && (
              <Icons.check
                className="mr-1 inline h-3 w-3"
                aria-hidden="true"
              />
            )}
            {t(TAG_I18N_MAP[tag])}
          </button>
        );
      })}
    </div>
  );
}
