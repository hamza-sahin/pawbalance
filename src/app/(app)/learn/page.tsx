"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useBlogPosts } from "@/hooks/use-blog";
import { BlogTagChips } from "@/components/blog/blog-tag-chips";
import { BlogFeaturedCard } from "@/components/blog/blog-featured-card";
import { BlogPostRow } from "@/components/blog/blog-post-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/icon";
import { localise } from "@/lib/types";
import type { BlogTag } from "@/lib/types";
import {
  getDefaultAutoCapitalize,
  getDefaultAutoCorrect,
  getDefaultSpellCheck,
} from "@/lib/input-capitalization";

export default function LearnPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { posts, isLoading, fetchPosts } = useBlogPosts();
  const [activeTags, setActiveTags] = useState<BlogTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleTagToggle = (tag: BlogTag | "all") => {
    if (tag === "all") {
      setActiveTags([]);
    } else {
      setActiveTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }
  };

  const filtered = useMemo(() => {
    let result = posts;

    if (activeTags.length > 0) {
      result = result.filter((p) =>
        activeTags.some((tag) => p.tags.includes(tag))
      );
    }

    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const title = localise(p, "title", locale).toLowerCase();
        const excerpt = localise(p, "excerpt", locale).toLowerCase();
        return title.includes(q) || excerpt.includes(q);
      });
    }

    return result;
  }, [posts, activeTags, searchQuery, locale]);

  const featuredPost = filtered.find((p) => p.is_featured);
  const regularPosts = filtered.filter((p) => !p.is_featured);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-20">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-11 w-full rounded-input" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-[280px] w-full rounded-card" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full rounded-[14px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Header */}
      <h1 className="font-heading text-[26px] font-bold text-txt">
        {t("learnTitle")}
      </h1>

      {/* Search */}
      <div className="relative">
        <Icons.search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-tertiary"
          aria-hidden="true"
        />
        <input
          type="text"
          autoCapitalize={getDefaultAutoCapitalize()}
          autoCorrect={getDefaultAutoCorrect()}
          spellCheck={getDefaultSpellCheck()}
          placeholder={t("searchArticles")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-input border border-border bg-surface py-3 pl-10 pr-4 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label={t("searchArticles")}
        />
      </div>

      {/* Tag filters */}
      <BlogTagChips activeTags={activeTags} onToggle={handleTagToggle} />

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <Icons.search className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
          <p className="font-medium text-txt-secondary">{t("noArticles")}</p>
        </div>
      ) : (
        <>
          {featuredPost && <BlogFeaturedCard post={featuredPost} />}

          <div className="flex flex-col gap-2.5">
            {regularPosts.map((post) => (
              <BlogPostRow key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
