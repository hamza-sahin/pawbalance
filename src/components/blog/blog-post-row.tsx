"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { BlogPost } from "@/lib/types";
import { localise } from "@/lib/types";
import { Icons } from "@/components/ui/icon";

const TAG_I18N_MAP: Record<string, string> = {
  nutrition: "tagNutrition",
  dog: "tagDog",
  cat: "tagCat",
  health: "tagHealth",
  safety: "tagSafety",
  behavior: "tagBehavior",
  diet: "tagDiet",
};

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogPostRow({ post }: { post: BlogPost }) {
  const t = useTranslations();
  const locale = useLocale();
  const title = localise(post, "title", locale);

  return (
    <Link
      href={`/learn/article?slug=${post.slug}`}
      className="flex items-start gap-3 rounded-[14px] border border-border bg-surface p-3 transition-all duration-150 hover:bg-surface-variant active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="h-20 w-20 min-w-[80px] overflow-hidden rounded-xl bg-surface-variant">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icons.learn className="h-6 w-6 text-txt-tertiary" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Tags */}
        <div className="mb-1 flex gap-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-dark"
            >
              {t(TAG_I18N_MAP[tag] ?? tag)}
            </span>
          ))}
        </div>

        {/* Title */}
        <h4 className="mb-1 line-clamp-2 font-heading text-sm font-semibold leading-snug text-txt">
          {title}
        </h4>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-txt-tertiary">
          <span className="text-[11px]">{formatDate(post.published_at, locale)}</span>
          <span className="text-[11px] text-border">·</span>
          <span className="text-[11px]">{t("minRead", { count: post.reading_time_min })}</span>
        </div>
      </div>
    </Link>
  );
}
