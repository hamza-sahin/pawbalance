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

export function BlogFeaturedCard({ post }: { post: BlogPost }) {
  const t = useTranslations();
  const locale = useLocale();
  const title = localise(post, "title", locale);
  const excerpt = localise(post, "excerpt", locale);

  return (
    <Link
      href={`/learn/article?slug=${post.slug}`}
      className="block rounded-card border border-border bg-surface overflow-hidden transition-all duration-150 hover:bg-surface-variant active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Featured image */}
      <div className="relative h-[180px] w-full overflow-hidden bg-surface-variant">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icons.learn className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
          </div>
        )}
        {/* Featured badge */}
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {t("featured")}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        <div className="mb-2 flex gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-dark"
            >
              {t(TAG_I18N_MAP[tag] ?? tag)}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="mb-1.5 font-heading text-[17px] font-semibold leading-snug text-txt">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="mb-2.5 line-clamp-2 text-[13px] leading-relaxed text-txt-secondary">
          {excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-txt-tertiary">
          <Icons.clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">{formatDate(post.published_at, locale)}</span>
          <span className="text-xs text-border">·</span>
          <span className="text-xs">{t("minRead", { count: post.reading_time_min })}</span>
        </div>
      </div>
    </Link>
  );
}
