# Learn Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Learn page that displays blog articles from 2gurmepati.com with native in-app rendering, full i18n (TR+EN), and a featured+list hybrid layout.

**Architecture:** One-time data seeding (scrape blog → translate → store in Supabase Cloud with images in self-hosted Minio-backed Supabase Storage). Frontend uses a `useBlogPosts` / `useBlogPost` hook to fetch from the `blog_posts` table. Listing page shows a featured card + compact rows with tag-based filtering. Article page renders sanitized HTML body with scoped prose styles.

**Tech Stack:** Next.js 15 (App Router, static export), Tailwind CSS 4, Supabase, next-intl, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/types.ts` | Modify | Add `BlogPost` type + `BLOG_TAGS` constant |
| `src/hooks/use-blog.ts` | Create | `useBlogPosts()` and `useBlogPost(slug)` hooks |
| `src/components/blog/blog-tag-chips.tsx` | Create | Horizontal scrollable tag filter chips |
| `src/components/blog/blog-featured-card.tsx` | Create | Large featured article card |
| `src/components/blog/blog-post-row.tsx` | Create | Compact horizontal article row |
| `src/components/blog/blog-article.tsx` | Create | Full article body renderer with prose styles |
| `src/app/(app)/learn/page.tsx` | Modify | Replace placeholder with real listing |
| `src/app/(app)/learn/article/page.tsx` | Create | Article reading view |
| `src/app/globals.css` | Modify | Add `.blog-prose` scoped styles |
| `src/components/ui/icon.tsx` | Modify | Add `Clock` and `ChevronLeft` icons |
| `src/messages/en.json` | Modify | Add learn.* i18n keys |
| `src/messages/tr.json` | Modify | Add learn.* i18n keys |

---

### Task 1: Database — Create `blog_posts` table

**Files:**
- No repo files — this is a Supabase Cloud SQL operation

- [ ] **Step 1: Create the `blog_posts` table in Supabase**

Run this SQL in the Supabase SQL editor (Dashboard → SQL Editor) for the Cloud project at `wfruynvxajqbosiharmy.supabase.co`:

```sql
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_tr text NOT NULL,
  title_en text NOT NULL,
  excerpt_tr text NOT NULL,
  excerpt_en text NOT NULL,
  body_tr text NOT NULL,
  body_en text NOT NULL,
  featured_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  published_at timestamptz NOT NULL,
  reading_time_min int2 NOT NULL DEFAULT 5,
  slug text NOT NULL UNIQUE,
  is_featured boolean NOT NULL DEFAULT false,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_tags_idx ON blog_posts USING GIN (tags);
```

- [ ] **Step 2: Enable RLS and add read policy**

```sql
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog posts are publicly readable"
  ON blog_posts FOR SELECT
  USING (true);
```

- [ ] **Step 3: Verify the table exists**

Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blog_posts' ORDER BY ordinal_position;`

Expected: 14 columns matching the schema above.

- [ ] **Step 4: Commit** (no repo files changed — this step is a checkpoint)

---

### Task 2: Data Seeding — Scrape blog, translate, upload images, insert rows

**Files:**
- No repo files — this is a one-time data operation. No script is left in the repo.

**Prerequisites:** Task 1 complete. Access to self-hosted Supabase Storage at the k3s cluster.

- [ ] **Step 1: Create `blog-images` bucket on self-hosted Supabase Storage**

Use the self-hosted Supabase Storage API (the storage pod running in the `supabase` namespace, exposed via Kong gateway). Create a public `blog-images` bucket. The self-hosted Supabase instance endpoints:
- Minio pod: `supabase-supabase-minio-*` in `supabase` namespace
- Storage pod: `supabase-supabase-storage-*` in `supabase` namespace
- External Minio API: `minio.optalgo.com`

Use `kubectl` to find the Kong/REST endpoint for the self-hosted Supabase, then create the bucket via the Supabase Storage API. The JWT secrets are in the Helm values at `refs/gitops/helm/supabase/values.yaml`.

- [ ] **Step 2: Fetch the blog listing page**

Fetch `https://2gurmepati.com/blog/` and extract all individual post URLs. The blog is WordPress-based. Look for post links in the listing HTML. There are ~30 posts.

- [ ] **Step 3: For each post, scrape content**

For each post URL, fetch the page and extract:
- **Title** (Turkish) — from `<h1>` or `<title>` element
- **Body HTML** (Turkish) — from the WordPress content area (typically `.entry-content` or `article` body)
- **Featured image URL** — from `<meta property="og:image">` or the first large image
- **Inline image URLs** — any `<img>` tags within the body HTML
- **Tags/categories** — from category/tag links on the page
- **Publication date** — from date metadata

- [ ] **Step 4: Process each post**

For each scraped post:
1. Generate `slug` from the Turkish title (kebab-case, ASCII transliteration — e.g. "Yavru Köpeklerde BARF Diyeti" → `yavru-kopeklerde-barf-diyeti`)
2. Calculate `reading_time_min` from Turkish body word count ÷ 200, minimum 1
3. Map Turkish category names to English tag keys:
   - "Beslenme" → `nutrition`
   - "Köpek" → `dog`
   - "Kedi" → `cat`
   - "Kedi & Köpek" or "Kedi ve Köpek" → both `cat` and `dog`
   - "Sağlık" → `health`
   - "Güvenlik" → `safety`
   - "Davranış" → `behavior`
   - "Diyet" → `diet`
4. Generate a 2-sentence Turkish excerpt from the first paragraph of the body
5. Translate to English: title → `title_en`, excerpt → `excerpt_en`, body → `body_en`
6. Download featured image + all inline images
7. Convert images to WebP format
8. Upload to `blog-images` bucket via self-hosted Supabase Storage API at path `{slug}/featured.webp` and `{slug}/inline/{filename}.webp`
9. Replace all image URLs in `body_tr` and `body_en` with the new Supabase Storage public URLs
10. Strip any WordPress-specific markup (shortcodes, unnecessary wrappers) from body HTML — keep clean semantic HTML (headings, paragraphs, images, lists, blockquotes, bold, italic)

- [ ] **Step 5: Insert all rows into Supabase Cloud**

Insert each processed post into the `blog_posts` table on Supabase Cloud (`wfruynvxajqbosiharmy.supabase.co`). Use the service role key for writes.

- [ ] **Step 6: Mark the most recent post as featured**

```sql
UPDATE blog_posts SET is_featured = true
WHERE published_at = (SELECT MAX(published_at) FROM blog_posts);
```

- [ ] **Step 7: Verify data**

Run: `SELECT slug, title_en, array_length(tags, 1) as tag_count, reading_time_min, is_featured FROM blog_posts ORDER BY published_at DESC LIMIT 5;`

Expected: 5 rows with English titles, tag counts > 0, reading times > 0, and exactly one row with `is_featured = true`.

---

### Task 3: Types & Constants — Add `BlogPost` type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add BlogPost type and BLOG_TAGS constant to `src/lib/types.ts`**

Add at the bottom of the file, before the Helpers section:

```typescript
// ============================================================
// Blog
// ============================================================

export const BLOG_TAGS = [
  "nutrition",
  "dog",
  "cat",
  "health",
  "safety",
  "behavior",
  "diet",
] as const;
export type BlogTag = (typeof BLOG_TAGS)[number];

export const BlogPostSchema = z.object({
  id: z.string(),
  title_tr: z.string(),
  title_en: z.string(),
  excerpt_tr: z.string(),
  excerpt_en: z.string(),
  body_tr: z.string().optional(),
  body_en: z.string().optional(),
  featured_image_url: z.string().nullable(),
  tags: z.array(z.string()),
  published_at: z.string(),
  reading_time_min: z.number(),
  slug: z.string(),
  is_featured: z.boolean(),
  source_url: z.string().nullable(),
  created_at: z.string(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(learn): add BlogPost type and BLOG_TAGS constant"
```

---

### Task 4: Icons — Add Clock and ChevronLeft

**Files:**
- Modify: `src/components/ui/icon.tsx`

- [ ] **Step 1: Add Clock and ChevronLeft imports**

In `src/components/ui/icon.tsx`, add `Clock` and `ChevronLeft` to the lucide-react import statement:

```typescript
import {
  ArrowLeft,
  Cake,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock,
  CookingPot,
  // ... rest unchanged
```

- [ ] **Step 2: Add to Icons object**

Add these entries to the Icons object:

```typescript
  chevronLeft: ChevronLeft,
  clock: Clock,
```

Place `chevronLeft` right before `chevronRight` in the Navigation section, and `clock` in a new "Blog" section comment or after the Misc section.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/icon.tsx
git commit -m "feat(learn): add Clock and ChevronLeft icons"
```

---

### Task 5: i18n — Add learn.* keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add English i18n keys**

In `src/messages/en.json`, add these keys (place them after the existing `"health"` key or at the end before the closing `}`):

```json
  "learnTitle": "Learn",
  "featured": "Featured",
  "backToArticles": "Back to articles",
  "minRead": "{count} min read",
  "noArticles": "No articles found",
  "tagAll": "All",
  "tagNutrition": "Nutrition",
  "tagDog": "Dog",
  "tagCat": "Cat",
  "tagHealth": "Health",
  "tagSafety": "Safety",
  "tagBehavior": "Behavior",
  "tagDiet": "Diet"
```

Note: The existing keys `"learn"`, `"searchArticles"`, `"all"`, `"nutrition"`, `"safety"`, `"health"` are already present and used by BottomNav and other pages. We add new namespaced keys to avoid conflicts and be explicit for the blog context.

- [ ] **Step 2: Add Turkish i18n keys**

In `src/messages/tr.json`, add matching keys:

```json
  "learnTitle": "Öğren",
  "featured": "Öne Çıkan",
  "backToArticles": "Makalelere dön",
  "minRead": "{count} dk okuma",
  "noArticles": "Makale bulunamadı",
  "tagAll": "Tümü",
  "tagNutrition": "Beslenme",
  "tagDog": "Köpek",
  "tagCat": "Kedi",
  "tagHealth": "Sağlık",
  "tagSafety": "Güvenlik",
  "tagBehavior": "Davranış",
  "tagDiet": "Diyet"
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build completes without errors (static export to `out/`).

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/tr.json
git commit -m "feat(learn): add i18n keys for blog listing and article views"
```

---

### Task 6: Hook — `useBlogPosts` and `useBlogPost`

**Files:**
- Create: `src/hooks/use-blog.ts`

- [ ] **Step 1: Create `src/hooks/use-blog.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { BlogPost } from "@/lib/types";

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title_tr, title_en, excerpt_tr, excerpt_en, featured_image_url, tags, published_at, reading_time_min, slug, is_featured, source_url, created_at"
      )
      .order("published_at", { ascending: false });
    if (error) throw error;
    setPosts((data as BlogPost[]) ?? []);
    setIsLoading(false);
  }, []);

  return { posts, isLoading, fetchPosts };
}

export function useBlogPost() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPost = useCallback(async (slug: string) => {
    setIsLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    setPost(data as BlogPost);
    setIsLoading(false);
  }, []);

  return { post, isLoading, fetchPost };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-blog.ts
git commit -m "feat(learn): add useBlogPosts and useBlogPost hooks"
```

---

### Task 7: Component — BlogTagChips

**Files:**
- Create: `src/components/blog/blog-tag-chips.tsx`

- [ ] **Step 1: Create `src/components/blog/blog-tag-chips.tsx`**

```typescript
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
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/blog-tag-chips.tsx
git commit -m "feat(learn): add BlogTagChips component"
```

---

### Task 8: Component — BlogFeaturedCard

**Files:**
- Create: `src/components/blog/blog-featured-card.tsx`

- [ ] **Step 1: Create `src/components/blog/blog-featured-card.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/blog-featured-card.tsx
git commit -m "feat(learn): add BlogFeaturedCard component"
```

---

### Task 9: Component — BlogPostRow

**Files:**
- Create: `src/components/blog/blog-post-row.tsx`

- [ ] **Step 1: Create `src/components/blog/blog-post-row.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/blog-post-row.tsx
git commit -m "feat(learn): add BlogPostRow component"
```

---

### Task 10: Component — BlogArticle (prose renderer)

**Files:**
- Create: `src/components/blog/blog-article.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `.blog-prose` styles to `src/app/globals.css`**

Add at the end of the file, after the `@media (prefers-reduced-motion)` block:

```css
/* Blog article prose styles */
.blog-prose {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-txt);
}

.blog-prose h2 {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
  color: var(--color-txt);
}

.blog-prose h3 {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 8px;
  color: var(--color-txt);
}

.blog-prose p {
  margin-bottom: 16px;
}

.blog-prose img {
  width: 100%;
  border-radius: 12px;
  margin: 16px 0;
}

.blog-prose blockquote {
  border-left: 3px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
  font-style: italic;
  color: var(--color-txt-secondary);
  font-size: 14px;
}

.blog-prose ul, .blog-prose ol {
  padding-left: 20px;
  margin-bottom: 16px;
}

.blog-prose li {
  margin-bottom: 4px;
}

.blog-prose a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-prose strong {
  font-weight: 600;
}

/* Allow text selection in blog articles */
.blog-prose {
  -webkit-user-select: text;
  user-select: text;
}
```

- [ ] **Step 2: Create `src/components/blog/blog-article.tsx`**

```typescript
"use client";

import { useLocale } from "next-intl";
import type { BlogPost } from "@/lib/types";
import { localise } from "@/lib/types";
import DOMPurify from "dompurify";

export function BlogArticle({ post }: { post: BlogPost }) {
  const locale = useLocale();
  const body = localise(post, "body", locale);
  const sanitized = DOMPurify.sanitize(body, {
    ALLOWED_TAGS: [
      "h2", "h3", "h4", "p", "a", "img", "ul", "ol", "li",
      "strong", "em", "blockquote", "br", "figure", "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "loading"],
  });

  return (
    <div
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

- [ ] **Step 3: Install DOMPurify**

Run: `npm install dompurify && npm install -D @types/dompurify`

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/blog-article.tsx src/app/globals.css package.json package-lock.json
git commit -m "feat(learn): add BlogArticle prose renderer with sanitized HTML"
```

---

### Task 11: Page — Learn listing (replace placeholder)

**Files:**
- Modify: `src/app/(app)/learn/page.tsx`

- [ ] **Step 1: Rewrite `src/app/(app)/learn/page.tsx`**

Replace the entire file contents:

```typescript
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Static export completes. The `/learn` route is built.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/learn/page.tsx
git commit -m "feat(learn): replace placeholder with blog listing page"
```

---

### Task 12: Page — Article reading view

**Files:**
- Create: `src/app/(app)/learn/article/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/learn/article/page.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useBlogPost } from "@/hooks/use-blog";
import { BlogArticle } from "@/components/blog/blog-article";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/icon";
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
      <div className="flex flex-col gap-4 p-4 pb-20">
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
    );
  }

  const title = localise(post, "title", locale);

  return (
    <div className="flex flex-col pb-20">
      {/* Back button */}
      <div className="flex items-center gap-2 p-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-surface transition-colors duration-150 hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("backToArticles")}
        >
          <Icons.chevronLeft className="h-[18px] w-[18px] text-txt" aria-hidden="true" />
        </button>
        <span className="text-sm text-txt-secondary">{t("backToArticles")}</span>
      </div>

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
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Static export completes. The `/learn/article` route is built.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/learn/article/page.tsx
git commit -m "feat(learn): add article reading view page"
```

---

### Task 13: Build Verification & QA

**Files:**
- No new files

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Static export completes without errors. Check that `out/learn.html` and `out/learn/article.html` exist.

- [ ] **Step 2: Dev server smoke test**

Run: `npm run dev`

Open `http://localhost:3000/learn` in a browser. Verify:
- The page loads without console errors
- Header shows "Learn" in serif font
- Search bar is functional (not disabled)
- Tag filter chips render with "All" pre-selected
- If data is seeded: featured card + article rows appear with images, tags, titles, dates
- If data is NOT yet seeded: empty state shows "No articles found"
- Clicking an article navigates to `/learn/article?slug=...`
- Article page shows back button, image, tags, title, meta, and full body
- Back button returns to the listing

- [ ] **Step 3: Invoke /qa for automated verification**

Run the `/qa` skill to test affected flows on browser and iOS simulator.

- [ ] **Step 4: Commit any fixes from QA**

If QA reveals issues, fix them and commit with descriptive messages.
