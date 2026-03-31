# Learn Page — Design Spec

**Date:** 2026-03-31
**Status:** Draft

## Overview

The Learn page displays blog articles sourced from https://2gurmepati.com/blog/ within PawBalance's native UI. Content is scraped once and stored in Supabase, with both Turkish originals and English translations. Images are stored in the self-hosted Minio-backed Supabase Storage cluster.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language handling | TR content + EN translated titles/excerpts/body | Primary audience is Turkish; EN users get a usable experience |
| Data source | One-time scrape → Supabase table | No runtime dependency on the blog; app owns the content |
| Article reading | Native in-app rendering | Seamless UX matching PawBalance's design system |
| Data architecture | Single flat `blog_posts` table | ~30 posts, ~7 tags — normalization adds complexity without benefit |
| Tag system | `text[]` array with multi-filter | Posts naturally span multiple categories; flexible filtering |
| Image storage | Self-hosted Supabase Storage (`blog-images` bucket on Minio) | Fully self-contained; no external dependency on blog CDN |
| Card layout | Featured + List Hybrid | Visual hierarchy for hero post + density for the rest |
| New posts | Manual DB insertion | No automated sync needed |

## Database Schema

### Table: `blog_posts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `title_tr` | `text` | Original Turkish title |
| `title_en` | `text` | Translated English title |
| `excerpt_tr` | `text` | ~2 sentence summary in Turkish |
| `excerpt_en` | `text` | ~2 sentence summary in English |
| `body_tr` | `text` | Full article HTML body, Turkish |
| `body_en` | `text` | Full article HTML body, English |
| `featured_image_url` | `text` | Full public URL from self-hosted Supabase Storage |
| `tags` | `text[]` | English keys, e.g. `{"nutrition", "dog"}` |
| `published_at` | `timestamptz` | Original blog publish date |
| `reading_time_min` | `int2` | Estimated from word count |
| `slug` | `text` | URL-safe identifier, unique |
| `is_featured` | `boolean` | Default false; one post featured at a time |
| `source_url` | `text` | Original 2gurmepati.com URL for reference |
| `created_at` | `timestamptz` | Default `now()` |

**Indexes:** unique on `slug`, GIN on `tags`.

**Tag values:** `nutrition`, `dog`, `cat`, `health`, `safety`, `behavior`, `diet`

### Storage: `blog-images` bucket

- **Location:** Self-hosted Supabase Storage on k3s cluster (Minio backend at `minio.optalgo.com`)
- **Bucket:** `blog-images` (public read)
- **Path pattern:** `{slug}/{filename}.webp` for featured images; `{slug}/inline/{filename}.webp` for article body images
- **Access:** Create bucket and upload via self-hosted Supabase Storage API; app reads via the public URL stored in `featured_image_url` and inline `<img>` tags in `body_tr`/`body_en`

## Data Seeding

The implementing agent performs a one-time scrape during the build phase. No script artifact is left in the repo.

### Seeding steps

1. Fetch the blog listing at `https://2gurmepati.com/blog/` — extract all post URLs
2. For each post URL, fetch the page and extract:
   - Title (Turkish)
   - Full article body HTML (Turkish)
   - Featured image URL
   - Inline image URLs within the body
   - Tags/categories
   - Publication date
3. Generate a `slug` from the Turkish title (kebab-case, ASCII-safe)
4. Calculate `reading_time_min` from word count (~200 words/min)
5. Translate to English: title → `title_en`, excerpt → `excerpt_en`, body → `body_en`
6. Generate a 2-sentence excerpt from the article body for both `excerpt_tr` and `excerpt_en`
7. Download all images (featured + inline), convert to WebP, upload to `blog-images` bucket via self-hosted Supabase Storage API
8. Replace image URLs in `body_tr` and `body_en` with the new Supabase Storage public URLs
9. Insert the row into `blog_posts` on Supabase Cloud
10. Mark the most recent post as `is_featured = true`

## UI Design

### Listing Page (`/learn`)

**Layout (top to bottom):**

1. **Header** — "Learn" in Lora 26px bold
2. **Search bar** — filters posts by title/excerpt match (client-side)
3. **Tag filter chips** — horizontal scrollable row: All, Nutrition, Dog, Cat, Health, Safety, Behavior, Diet. Active chip uses primary green fill; inactive uses white with border. Multi-select: tapping a chip toggles it; "All" deselects others.
4. **Featured card** — the post with `is_featured = true`:
   - Full-width image (180px height, 16px radius)
   - "Featured" badge overlay (top-left, frosted glass)
   - Tag chips below image
   - Title in Lora 17px semibold
   - Excerpt in Raleway 13px, 2-line clamp
   - Date + reading time with clock icon
5. **Article list** — remaining posts as compact horizontal rows:
   - 80x80px thumbnail (12px radius)
   - Tag chips (smaller, 10px font)
   - Title in Lora 14px semibold, 2-line clamp
   - Date + reading time
6. **Bottom padding** — `pb-20` for BottomNav clearance

**Loading state:** Skeleton placeholders matching the card/row dimensions.

**Empty state (no search results):** Icon + "No articles found" message.

### Article Reading Page (`/learn/article?slug=...`)

**Layout (top to bottom):**

1. **Back button** — 36px circle with chevron-left, "Back to articles" label
2. **Featured image** — full-width with 16px radius, inside 16px horizontal margin
3. **Tag chips** — same style as listing
4. **Title** — Lora 22px bold, line-height 1.3
5. **Meta line** — clock icon + date + "·" + reading time, separated by a bottom border
6. **Article body** — rendered HTML with scoped prose styles:
   - Body text: Raleway 15px, line-height 1.7, color `text-txt`
   - Headings: Lora, sized proportionally (h2: 18px, h3: 16px)
   - Blockquotes: left green border + light green background (for disclaimers)
   - Inline images: full-width, 12px radius, optional caption below
   - Links: primary green color
7. **Bottom padding** — `pb-20`

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `BlogFeaturedCard` | `src/components/blog/blog-featured-card.tsx` | Large card for the featured post |
| `BlogPostRow` | `src/components/blog/blog-post-row.tsx` | Compact horizontal row for list items |
| `BlogTagChips` | `src/components/blog/blog-tag-chips.tsx` | Horizontal scrollable filter chips with multi-select |
| `BlogArticle` | `src/components/blog/blog-article.tsx` | Full article body renderer with prose styles |

## Hook

**File:** `src/hooks/use-blog.ts`

```
useBlogPosts() → { posts, isLoading, fetchPosts }
```
- Fetches all posts from `blog_posts` (excluding `body_tr`/`body_en` for listing performance)
- All filtering done client-side (dataset is ~30 posts): tag matching and text search on title/excerpt
- Uses `localise()` for TR/EN field selection based on current locale

```
useBlogPost(slug) → { post, isLoading, fetchPost }
```
- Fetches single post by slug including full body
- Returns localized fields

## Routing

| Route | Purpose |
|-------|---------|
| `/learn` | Article listing (replace existing placeholder) |
| `/learn/article?slug=...` | Article reading view (new page) |

Uses query params per the static export constraint. Back navigation via `router.back()`.

## i18n

New keys in `messages/en.json` and `messages/tr.json`:

```
learn.title            — "Learn" / "Öğren"
learn.searchArticles   — "Search articles..." / "Makale ara..."
learn.featured         — "Featured" / "Öne Çıkan"
learn.backToArticles   — "Back to articles" / "Makalelere dön"
learn.minRead          — "{count} min read" / "{count} dk okuma"
learn.noResults        — "No articles found" / "Makale bulunamadı"
learn.tags.all         — "All" / "Tümü"
learn.tags.nutrition   — "Nutrition" / "Beslenme"
learn.tags.dog         — "Dog" / "Köpek"
learn.tags.cat         — "Cat" / "Kedi"
learn.tags.health      — "Health" / "Sağlık"
learn.tags.safety      — "Safety" / "Güvenlik"
learn.tags.behavior    — "Behavior" / "Davranış"
learn.tags.diet        — "Diet" / "Diyet"
```

Tag values in the DB are English keys. Display-time localization: `"nutrition"` → `t('learn.tags.nutrition')`.

## Infrastructure Notes

- **Blog posts table:** Supabase Cloud (same instance as pets, foods, auth)
- **Blog images bucket:** Self-hosted Supabase Storage on k3s cluster (Minio backend)
  - Minio pod: `supabase-supabase-minio-*` in `supabase` namespace
  - External API: `minio.optalgo.com`
  - Supabase Storage pod: `supabase-supabase-storage-*` in `supabase` namespace
  - Create `blog-images` bucket via self-hosted Supabase Storage API
- **No runtime dependency** on 2gurmepati.com — all content and images are self-hosted after seeding

## Visual Reference

Mockups are saved in `.superpowers/brainstorm/` — see `real-example-listing.html` for the listing and article reading views with real content from the BARF Diet blog post.
