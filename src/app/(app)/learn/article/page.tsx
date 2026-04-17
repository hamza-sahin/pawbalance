"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useBlogPost } from "@/hooks/use-blog";
import { BlogArticle } from "@/components/blog/blog-article";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/icon";
import { AppScreen } from "@/components/navigation/app-screen";
import { localise } from "@/lib/types";

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
    month: "long",
    day: "numeric",
  });
}

export default function ArticlePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const { post, isLoading, fetchPost } = useBlogPost();

  useEffect(() => {
    if (slug) fetchPost(slug);
  }, [slug, fetchPost]);

  if (isLoading || !post) {
    return (
      <AppScreen
        title={t("learnTitle")}
        showBack
        onBack={() => router.back()}
        shellMode="stacked"
      >
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-[200px] w-full rounded-card" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppScreen>
    );
  }

  const title = localise(post, "title", locale);

  return (
    <AppScreen
      title={t("learnTitle")}
      showBack
      onBack={() => router.back()}
      shellMode="stacked"
    >
      <div className="flex flex-col">
        {/* Featured image */}
        {post.featured_image_url && (
          <div className="mx-4 mb-4 overflow-hidden rounded-card">
            <img
              src={post.featured_image_url}
              alt={title}
              className="h-[200px] w-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Article content */}
        <div className="px-5">
          {/* Tags */}
          <div className="mb-2.5 flex gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-dark"
              >
                {t(TAG_I18N_MAP[tag] ?? tag)}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="mb-2.5 font-heading text-[22px] font-bold leading-snug text-txt">
            {title}
          </h1>

          {/* Meta line */}
          <div className="mb-5 flex items-center gap-1.5 border-b border-border pb-4 text-txt-tertiary">
            <Icons.clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[13px]">{formatDate(post.published_at, locale)}</span>
            <span className="text-border">·</span>
            <span className="text-[13px]">{t("minRead", { count: post.reading_time_min })}</span>
          </div>

          {/* Body */}
          <BlogArticle post={post} />
        </div>
      </div>
    </AppScreen>
  );
}
