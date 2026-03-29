# UI/UX Audit Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **IMPORTANT:** Before making ANY UI changes, invoke the `/ui-ux-pro-max` skill to get design guidance. This applies to every task in this plan.

**Goal:** Fix 147 UI/UX issues identified in the comprehensive audit, focusing on the 8 systemic root causes that affect ~80% of all issues.

**Architecture:** Install lucide-react as the single icon library. Add Lora + Raleway web fonts for brand typography. Fix iOS safe areas via CSS `env()` + viewport-fit meta. Upgrade base UI components (Input, Button, Dialog, BreedSelector) with accessibility built in. Replace all emoji with SVG icons. Add missing i18n keys. Make layouts responsive. Add onboarding wizard with progress indicator.

**Tech Stack:** Next.js 15, Tailwind CSS 4, lucide-react, next-intl, Capacitor 7

**Spec:** `docs/superpowers/specs/2026-03-29-ui-ux-audit-design.md`

---

## File Map

### New files
- `src/components/ui/icon.tsx` — Centralized icon component mapping category names to Lucide icons
- `src/components/ui/password-input.tsx` — Password input with show/hide toggle
- `src/components/ui/progress-steps.tsx` — Step indicator for onboarding wizard

### Modified files (by task)

| Task | Files Modified |
|------|---------------|
| 1 | `package.json` |
| 2 | `src/app/globals.css`, `src/app/layout.tsx` |
| 3 | `src/app/globals.css`, `src/components/ui/button.tsx` |
| 4 | `src/components/ui/input.tsx` |
| 5 | `src/components/ui/icon.tsx` (create), `src/lib/constants.ts` |
| 6 | `src/components/navigation/bottom-nav.tsx` |
| 7 | `src/components/food/safety-badge.tsx`, `src/components/food/food-card.tsx`, `src/components/food/category-grid.tsx` |
| 8 | `src/components/pet/pet-card.tsx`, `src/components/pet/photo-picker.tsx`, `src/components/pet/activity-level-selector.tsx` |
| 9 | `src/app/(app)/search/page.tsx`, `src/app/(app)/search/food/page.tsx`, `src/app/(app)/search/category/page.tsx` |
| 10 | `src/app/(app)/profile/page.tsx`, `src/app/(app)/scan/page.tsx`, `src/app/(app)/bowl/page.tsx`, `src/app/(app)/learn/page.tsx` |
| 11 | `src/app/(auth)/forgot-password/page.tsx` |
| 12 | `src/app/(app)/layout.tsx` |
| 13 | `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/forgot-password/page.tsx` |
| 14 | `src/app/onboarding/page.tsx` |
| 15 | `src/components/ui/dialog.tsx` |
| 16 | `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(app)/search/page.tsx`, `src/components/pet/pet-card.tsx`, `src/components/food/food-card.tsx`, `src/components/food/category-grid.tsx` |
| 17 | `src/messages/en.json`, `src/messages/tr.json` |
| 18 | `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/components/food/food-request-dialog.tsx`, `src/components/pet/pet-card.tsx`, `src/app/(app)/search/category/page.tsx`, `src/components/pet/bcs-slider.tsx`, `src/components/pet/photo-picker.tsx` |
| 19 | `src/components/pet/breed-selector.tsx` |
| 20 | `src/app/globals.css`, `tailwind.config.js`, `src/app/layout.tsx` |
| 21 | `src/components/ui/progress-steps.tsx` (create), `src/app/onboarding/page.tsx`, `src/components/pet/pet-form.tsx` |

---

## Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install lucide-react**

```bash
cd /Users/hamzasahin/src/petpal/web && npm install lucide-react
```

Expected: `lucide-react` added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify installation**

```bash
cd /Users/hamzasahin/src/petpal/web && node -e "require('lucide-react'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add package.json package-lock.json && git commit -m "chore: install lucide-react icon library"
```

---

## Task 2: Fix iOS safe area + viewport-fit

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

This fixes: Dynamic Island/status bar collision on iPhone 16 and Pro Max (audit issue #2, CRITICAL). Also adds global `cursor-pointer` rule, `prefers-reduced-motion` support, and autofill styling override.

- [ ] **Step 1: Read layout.tsx**

```bash
cat src/app/layout.tsx
```

Need to understand the root layout to add `viewport-fit=cover` meta tag.

- [ ] **Step 2: Add viewport-fit=cover to root layout**

In `src/app/layout.tsx`, find the `<meta name="viewport"` tag (or the Next.js metadata export) and ensure it includes `viewport-fit=cover`. If using Next.js metadata API:

```tsx
export const metadata = {
  // ... existing metadata
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};
```

If no metadata export exists, add this `<meta>` tag inside `<head>` in the root layout.

- [ ] **Step 3: Add safe area CSS utilities to globals.css**

Append to `src/app/globals.css` after the `@theme` block:

```css
/* Safe area utilities for iOS Capacitor */
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Autofill override to match design system */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px var(--color-surface-variant) inset !important;
  -webkit-text-fill-color: var(--color-txt) !important;
}

/* Cursor pointer on all interactive elements (UI/UX Pro Max anti-pattern: missing cursor-pointer) */
a, button, [role="button"], [role="tab"], [role="radio"], summary {
  cursor: pointer;
}

/* Respect reduced motion preference (UI/UX Pro Max guideline: HIGH severity) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Add safe-top to app layout container**

In `src/app/(app)/layout.tsx`, change line 42 from:

```tsx
<div className="mx-auto min-h-screen max-w-md bg-canvas pb-20">
```

to:

```tsx
<div className="safe-top mx-auto min-h-screen max-w-md bg-canvas pb-20">
```

- [ ] **Step 5: Add safe-top to onboarding page**

In `src/app/onboarding/page.tsx`, find the outermost container `<div>` and add `safe-top` class.

- [ ] **Step 6: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/globals.css src/app/layout.tsx src/app/\(app\)/layout.tsx src/app/onboarding/page.tsx && git commit -m "fix: add iOS safe area padding to prevent Dynamic Island collision"
```

---

## Task 3: Fix button contrast ratio

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/button.tsx`

This fixes: Primary button white text on #7C9A82 fails WCAG AA at 3.1:1 (needs 4.5:1).

- [ ] **Step 1: Add button-specific primary color to theme**

In `src/app/globals.css`, inside the `@theme` block, after `--color-primary-dark: #526B57;` (line 11), add:

```css
  --color-primary-btn: #4A7C59;
```

This darker sage gives ~4.7:1 contrast against white, passing WCAG AA.

- [ ] **Step 2: Update Button primary variant**

In `src/components/ui/button.tsx`, change line 27 from:

```tsx
primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
```

to:

```tsx
primary: "bg-primary-btn text-white hover:bg-primary-dark shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
```

- [ ] **Step 3: Add focus-visible to all button variants**

In `src/components/ui/button.tsx`, update all variants to include focus-visible:

```tsx
const variants = {
  primary: "bg-primary-btn text-white hover:bg-primary-dark shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  secondary: "bg-secondary text-white hover:bg-secondary-dark focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
  outline: "border border-border text-txt hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  ghost: "text-txt hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
};
```

- [ ] **Step 4: Add aria-busy for loading state**

In `src/components/ui/button.tsx`, add `aria-busy={isLoading}` to the `<button>` element:

```tsx
<button
  ref={ref}
  className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
  disabled={disabled || isLoading}
  aria-busy={isLoading || undefined}
  {...props}
>
```

- [ ] **Step 5: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/globals.css src/components/ui/button.tsx && git commit -m "fix: improve primary button contrast to WCAG AA and add focus-visible rings"
```

---

## Task 4: Upgrade Input component (auto-ID, aria, focus-visible)

**Files:**
- Modify: `src/components/ui/input.tsx`

This fixes: Missing label-input association (every Input usage), missing aria-describedby for errors, missing focus-visible.

- [ ] **Step 1: Rewrite Input component**

Replace the entire content of `src/components/ui/input.tsx` with:

```tsx
import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-txt-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`rounded-input border border-border bg-surface-variant px-4 py-3 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
```

Key changes:
- `useId()` auto-generates unique IDs — labels always linked to inputs
- `aria-invalid` set when error exists
- `aria-describedby` links input to error message
- Error `<p>` has `role="alert"` for screen reader announcement
- Added `focus-visible:ring` for keyboard users

- [ ] **Step 2: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/ui/input.tsx && git commit -m "fix: auto-generate input IDs, add aria-describedby and focus-visible"
```

---

## Task 5: Create Icon component + update constants

**Files:**
- Create: `src/components/ui/icon.tsx`
- Modify: `src/lib/constants.ts`

This creates the centralized icon system that replaces all emoji usage.

- [ ] **Step 1: Create the Icon component**

Create `src/components/ui/icon.tsx`:

```tsx
import {
  ArrowLeft,
  Cake,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CircleX,
  CookingPot,
  Crown,
  Dumbbell,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  History,
  Info,
  Mail,
  PawPrint,
  Pencil,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Skull,
  Trash2,
  TriangleAlert,
  User,
  UtensilsCrossed,
  X,
  type LucideProps,
} from "lucide-react";

// Re-export commonly used icons with semantic names for the app
export const Icons = {
  // Navigation
  arrowLeft: ArrowLeft,
  chevronRight: ChevronRight,
  search: Search,
  close: X,

  // Safety
  safe: ShieldCheck,
  caution: TriangleAlert,
  toxic: CircleX,

  // Food detail sections
  dangerousParts: CircleAlert,
  preparation: CookingPot,
  warnings: TriangleAlert,
  benefits: Heart,

  // Pet stats
  paw: PawPrint,
  age: Cake,
  weight: Scale,
  activity: Dumbbell,
  calories: Flame,

  // Pet actions
  edit: Pencil,
  delete: Trash2,
  camera: Camera,

  // Profile menu
  globe: Globe,
  history: History,
  crown: Crown,
  help: HelpCircle,
  info: Info,
  settings: Settings,
  user: User,

  // Tabs
  scanner: FileText,
  bowl: UtensilsCrossed,
  learn: GraduationCap,

  // Auth
  mail: Mail,
  check: Check,

  // Misc
  skull: Skull,
  bowl: UtensilsCrossed,
} as const;

export type IconName = keyof typeof Icons;
```

- [ ] **Step 2: Update constants.ts — change getCategoryIcon return type**

In `src/lib/constants.ts`, the `CATEGORY_ICONS` map and `getCategoryIcon` function currently return emoji strings. We keep the map for backward compatibility during migration but add a new approach. Replace lines 34-36:

```ts
export function getCategoryIcon(categoryEn: string): string {
  return CATEGORY_ICONS[categoryEn] ?? "🍽️";
}
```

with:

```ts
/** @deprecated Use Icon component directly. Kept during migration. */
export function getCategoryIcon(categoryEn: string): string {
  return CATEGORY_ICONS[categoryEn] ?? "🍽️";
}
```

Note: Category icons will be handled in Task 7 by using a colored circle + first letter as the category indicator, since Lucide doesn't have 25 specific food icons.

- [ ] **Step 3: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/ui/icon.tsx src/lib/constants.ts && git commit -m "feat: create centralized Icon component with lucide-react"
```

---

## Task 6: Fix BottomNav (bowl icon, aria, touch targets, label size)

**Files:**
- Modify: `src/components/navigation/bottom-nav.tsx`

This fixes: Wrong bowl icon (house instead of bowl), missing aria-label on center button, hardcoded stroke="white", 10px labels, no active indicator, insufficient touch targets.

- [ ] **Step 1: Rewrite bottom-nav.tsx**

Replace the entire content of `src/components/navigation/bottom-nav.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const tabs = [
  { key: "scanner", href: "/scan", label: "scanner" },
  { key: "bowl", href: "/bowl", label: "bowl" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;

const icons: Record<string, React.ReactNode> = {
  scanner: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  bowl: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11h18M5 11c0 4.4 3.1 8 7 8s7-3.6 7-8" />
      <path d="M8.5 19c.8.6 2.1 1 3.5 1s2.7-.4 3.5-1" />
    </svg>
  ),
  search: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  learn: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map((tab) => {
          const isCenter = tab.key === "search";
          const isActive = pathname.startsWith(tab.href);

          if (isCenter) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-label={t(tab.label)}
                aria-current={isActive ? "page" : undefined}
                className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-btn text-white shadow-[0_4px_12px_rgba(74,124,89,0.3)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {icons[tab.key]}
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px] transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-txt-tertiary"
              } focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
            >
              {icons[tab.key]}
              <span>{t(tab.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

Key changes:
- Bowl icon: replaced house SVG with a bowl/dish shape
- All SVGs: added `aria-hidden="true"`
- Search center button: uses `stroke="currentColor"` instead of `stroke="white"`, uses `bg-primary-btn text-white`
- Added `aria-label` to center search link
- Added `aria-current="page"` on active tab
- Added `aria-label="Main navigation"` on `<nav>`
- Touch targets: `min-h-[44px] min-w-[44px]` on non-center tabs
- Label size: `text-[11px]` instead of `text-[10px]`
- Active font: added `font-medium` for active state
- Focus-visible rings on all tabs

- [ ] **Step 2: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/navigation/bottom-nav.tsx && git commit -m "fix: bottom nav — bowl icon, aria labels, touch targets, focus states"
```

---

## Task 7: Replace emoji in food components

**Files:**
- Modify: `src/components/food/safety-badge.tsx`
- Modify: `src/components/food/food-card.tsx`
- Modify: `src/components/food/category-grid.tsx`

- [ ] **Step 1: Update safety-badge.tsx**

Replace the entire content of `src/components/food/safety-badge.tsx`:

```tsx
import type { SafetyLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";
import { useTranslations } from "next-intl";

const iconMap: Record<SafetyLevel, React.ComponentType<{ className?: string }>> = {
  SAFE: Icons.safe,
  MODERATE: Icons.caution,
  TOXIC: Icons.toxic,
};

const variantMap: Record<SafetyLevel, "safe" | "caution" | "toxic"> = {
  SAFE: "safe",
  MODERATE: "caution",
  TOXIC: "toxic",
};

interface SafetyBadgeProps {
  level: SafetyLevel;
  className?: string;
}

export function SafetyBadge({ level, className }: SafetyBadgeProps) {
  const t = useTranslations();
  const labels: Record<SafetyLevel, string> = {
    SAFE: t("safe"),
    MODERATE: t("caution"),
    TOXIC: t("toxic"),
  };
  const Icon = iconMap[level];

  return (
    <Badge variant={variantMap[level]} className={className}>
      <Icon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
      {labels[level]}
    </Badge>
  );
}
```

- [ ] **Step 2: Update food-card.tsx**

Replace the entire content of `src/components/food/food-card.tsx`:

```tsx
import Link from "next/link";
import type { Food } from "@/lib/types";
import { localise } from "@/lib/types";
import { SafetyBadge } from "./safety-badge";
import { Icons } from "@/components/ui/icon";
import { useLocale } from "next-intl";

const borderColorMap: Record<string, string> = {
  SAFE: "border-l-safe",
  MODERATE: "border-l-caution",
  TOXIC: "border-l-toxic",
};

export function FoodCard({ food }: { food: Food }) {
  const locale = useLocale();
  const name = localise(food, "name", locale);
  const category = localise(food, "category", locale);

  return (
    <Link
      href={`/search/food?id=${food.id}`}
      className={`flex items-center gap-3 rounded-card border border-border border-l-4 ${borderColorMap[food.safety_level] ?? ""} bg-surface p-3 transition-colors hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-sm font-semibold text-primary">
        {category.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-txt">{name}</p>
        <p className="text-xs text-txt-secondary">{category}</p>
      </div>
      <SafetyBadge level={food.safety_level} />
      <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
    </Link>
  );
}
```

Key changes: Category emoji → colored first-letter circle. Chevron `›` → Lucide ChevronRight. Added `focus-visible:ring`. Added `aria-hidden` on decorative icon.

- [ ] **Step 3: Update category-grid.tsx**

Replace the entire content of `src/components/food/category-grid.tsx`:

```tsx
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
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-2 py-4 transition-colors hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
```

Key changes: Emoji category icons → colored initial-letter circles. Added `focus-visible:ring`. Added `aria-hidden` on decorative element.

- [ ] **Step 4: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/food/safety-badge.tsx src/components/food/food-card.tsx src/components/food/category-grid.tsx && git commit -m "fix: replace emoji with SVG icons in food components"
```

---

## Task 8: Replace emoji in pet components + fix ARIA roles

**Files:**
- Modify: `src/components/pet/pet-card.tsx`
- Modify: `src/components/pet/photo-picker.tsx`
- Modify: `src/components/pet/activity-level-selector.tsx`
- Modify: `src/components/pet/pet-form.tsx`

Additional fixes in this task (from UI/UX Pro Max review):
- Add `role="radiogroup"` / `role="radio"` + `aria-checked` to ActivityLevelSelector
- Add `role="radiogroup"` / `role="radio"` + `aria-checked` to gender toggle in PetForm
- Change `type="number"` to `type="text" inputmode="decimal"` for weight and `inputmode="numeric"` for age in PetForm
- Add `loading="lazy"` and `onError` fallback to all `<img>` avatar elements

- [ ] **Step 1: Rewrite pet-card.tsx**

Replace the entire content of `src/components/pet/pet-card.tsx`:

```tsx
import type { Pet } from "@/lib/types";
import { calculateDER, type ActivityLevel } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { useTranslations } from "next-intl";

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const t = useTranslations();
  const der =
    pet.weight_kg != null
      ? calculateDER(pet.weight_kg, pet.activity_level as ActivityLevel)
      : null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-variant">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('class'); }}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : null}
          {!pet.avatar_url && (
            <Icons.paw className="h-6 w-6 text-txt-tertiary" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-txt">{pet.name}</p>
              {pet.breed && (
                <p className="text-sm text-txt-secondary">{pet.breed}</p>
              )}
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label={`${t("editPet")} ${pet.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-variant hover:text-txt focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icons.edit className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label={`${t("deletePet")} ${pet.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-error hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-error"
                >
                  <Icons.delete className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pet.age_months != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            <Icons.age className="h-3 w-3" aria-hidden="true" /> {pet.age_months} {t("months")}
          </span>
        )}
        {pet.weight_kg != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            <Icons.weight className="h-3 w-3" aria-hidden="true" /> {pet.weight_kg} {t("kg")}
          </span>
        )}
        {pet.gender && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            {pet.gender === "MALE" ? "♂" : "♀"} {pet.is_neutered ? t("neutered") : t("intact")}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
          <Icons.activity className="h-3 w-3" aria-hidden="true" /> {pet.activity_level}
        </span>
      </div>
      {der != null && (
        <div className="mt-3 flex items-center gap-1.5 rounded-button bg-primary-light/15 px-3 py-2 text-sm text-primary-dark">
          <Icons.calories className="h-4 w-4" aria-hidden="true" />
          {t("dailyCalories")}: <span className="font-semibold text-primary">{t("kcalPerDay", { kcal: der })}</span>
        </div>
      )}
    </Card>
  );
}
```

Key changes: All emoji → Lucide icons. Edit/delete buttons now 36x36px with `aria-label`. Hardcoded "months", "kg", "Intact", "Daily Calories:" → `t()` calls. Added `aria-hidden` on all icons.

- [ ] **Step 2: Update photo-picker.tsx**

In `src/components/pet/photo-picker.tsx`, replace the emoji and hardcoded text. Replace line 43 (`"🐾"`) with:

```tsx
<Icons.paw className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
```

And add the import at the top:

```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 46 (`"Add photo"`) with:

```tsx
{t("addPhoto")}
```

Add `aria-label={t("addPhoto")}` to the pick button (the button/div that triggers photo selection).

- [ ] **Step 3: Update activity-level-selector.tsx with ARIA roles**

In `src/components/pet/activity-level-selector.tsx`:

Add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 40 (`"✓"`) with:
```tsx
<Icons.check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
```

Add `role="radiogroup"` to the parent container div, and for each option button add:
```tsx
role="radio"
aria-checked={value === level.key}
```

- [ ] **Step 3b: Fix gender toggle ARIA in pet-form.tsx**

In `src/components/pet/pet-form.tsx`, on the gender grid container (line 117), add `role="radiogroup"` and `aria-label={t("petGender")}`.

On each gender button (line 119), add:
```tsx
role="radio"
aria-checked={gender === g}
```

- [ ] **Step 3c: Fix inputmode on number fields in pet-form.tsx**

In `src/components/pet/pet-form.tsx`:

Replace the age Input (line 94-101):
- Change `type="number"` to `type="text" inputmode="numeric" pattern="[0-9]*"`

Replace the weight Input (line 103-110):
- Change `type="number" step="0.1"` to `type="text" inputmode="decimal" pattern="[0-9.]*"`

This triggers the correct mobile keyboard without showing native number spinners.

- [ ] **Step 4: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/pet/pet-card.tsx src/components/pet/photo-picker.tsx src/components/pet/activity-level-selector.tsx && git commit -m "fix: replace emoji with SVG icons in pet components, add aria-labels"
```

---

## Task 9: Replace emoji in search pages

**Files:**
- Modify: `src/app/(app)/search/page.tsx`
- Modify: `src/app/(app)/search/food/page.tsx`
- Modify: `src/app/(app)/search/category/page.tsx`

- [ ] **Step 1: Update search/page.tsx**

Make these changes in `src/app/(app)/search/page.tsx`:

Add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 61 (`"🐾"`) with:
```tsx
<Icons.paw className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
```

Replace line 74 (search emoji `"🔍"`) with:
```tsx
<Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-tertiary" aria-hidden="true" />
```

And remove the wrapping `<span>` — the Icon component is self-positioning.

Replace line 87 (clear button `"✕"`) with:
```tsx
<Icons.close className="h-4 w-4" aria-hidden="true" />
```

Add `aria-label={t("cancel")}` to the clear button on line 83-88.

Add `min-h-[44px]` to the "Request New Food" button on line 107.

- [ ] **Step 2: Update food/page.tsx**

In `src/app/(app)/search/food/page.tsx`:

Add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 47 (`"←"`) with:
```tsx
<Icons.arrowLeft className="h-5 w-5" aria-hidden="true" />
```

Add `aria-label={t("back")}` to the Link, and add `min-h-[44px] min-w-[44px] inline-flex items-center` classes.

Replace line 51 (`{icon}` — the 5xl emoji) with:
```tsx
<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary" aria-hidden="true">
  {food.category_en.charAt(0)}
</div>
```

Replace line 55 (`{icon} {category}`) with just `{category}`.

Replace lines 63, 72, 81, 94 (section emoji icons) with Lucide components:
- Line 63 `🚫` → `<Icons.dangerousParts className="h-5 w-5" aria-hidden="true" />`
- Line 72 `🍳` → `<Icons.preparation className="h-5 w-5" aria-hidden="true" />`
- Line 81 `⚠️` → `<Icons.warnings className="h-5 w-5" aria-hidden="true" />`
- Line 94 `💚` → `<Icons.benefits className="h-5 w-5" aria-hidden="true" />`

- [ ] **Step 3: Update category/page.tsx**

In `src/app/(app)/search/category/page.tsx`:

Add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 31 (`"← Back"`) with:
```tsx
<Icons.arrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
{t("back")}
```

Add `aria-label={t("back")}` and `min-h-[44px] inline-flex items-center` to the Link.

Replace line 35 (`{icon}` — the 5xl emoji) with:
```tsx
<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary" aria-hidden="true">
  {categoryName.charAt(0)}
</div>
```

Replace line 37 (`{foods.length} foods`) with:
```tsx
{t("foodCount", { count: foods.length })}
```

Replace `"●"` bullets in badges (lines 39-41) with small colored dots using Tailwind:
```tsx
{safeCount > 0 && <Badge variant="safe"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-safe" aria-hidden="true" /> {safeCount} {t("safe")}</Badge>}
{cautionCount > 0 && <Badge variant="caution"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-caution" aria-hidden="true" /> {cautionCount} {t("caution")}</Badge>}
{toxicCount > 0 && <Badge variant="toxic"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-toxic" aria-hidden="true" /> {toxicCount} {t("toxic")}</Badge>}
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/\(app\)/search/page.tsx src/app/\(app\)/search/food/page.tsx src/app/\(app\)/search/category/page.tsx && git commit -m "fix: replace emoji with SVG icons in search pages, add aria-labels"
```

---

## Task 10: Replace emoji in profile + placeholder tabs

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`
- Modify: `src/app/(app)/scan/page.tsx`
- Modify: `src/app/(app)/bowl/page.tsx`
- Modify: `src/app/(app)/learn/page.tsx`

- [ ] **Step 1: Update profile/page.tsx**

In `src/app/(app)/profile/page.tsx`, add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace the `menuItems` array (lines 15-32) icons from emoji to Icon components. Change `icon` field type from string to `React.ComponentType`:

```tsx
const menuItems = [
  { href: "/profile/pets", icon: Icons.paw, label: t("pets") },
  {
    href: "/profile/language",
    icon: Icons.globe,
    label: t("language"),
    trailing: locale === "tr" ? "Türkçe" : "English",
  },
  { href: "/profile/scan-history", icon: Icons.history, label: t("scanHistory") },
  {
    href: "#",
    icon: Icons.crown,
    label: t("upgradeToPremium"),
    badge: <Badge variant="premium">PRO</Badge>,
  },
  { href: "#", icon: Icons.help, label: t("helpAndSupport") },
  { href: "#", icon: Icons.info, label: t("about") },
];
```

Replace line 38 settings button (`"⚙️"`) with:
```tsx
<button className="flex h-10 w-10 items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-variant" aria-label={t("settings")}>
  <Icons.settings className="h-5 w-5" aria-hidden="true" />
</button>
```

Replace line 47 avatar fallback (`"👤"`) with:
```tsx
<Icons.user className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
```

Replace line 62 menu icon rendering (`<span className="text-lg">{item.icon}</span>`) with:
```tsx
<item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
```

Replace line 68 chevron (`"›"`) with:
```tsx
<Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
```

- [ ] **Step 2: Update scan/page.tsx**

Replace the entire content of `src/app/(app)/scan/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";

export default function ScanPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="mb-6 text-lg font-bold text-txt">{t("scanner")}</h1>

      <div className="flex w-full flex-col items-center gap-4 rounded-card border-2 border-dashed border-border bg-surface p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-card bg-primary/10">
          <Icons.scanner className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-txt">{t("scanFoodLabel")}</h2>
        <p className="text-sm text-txt-secondary">{t("pointCamera")}</p>
        <Button onClick={() => {}} aria-disabled="true">{t("openCamera")}</Button>
      </div>

      <div className="mt-6 flex w-full items-center gap-3 rounded-card bg-caution-bg/50 p-3">
        <Badge variant="premium">
          <Icons.crown className="mr-1 inline h-3 w-3" aria-hidden="true" />
          PRO
        </Badge>
        <div>
          <p className="text-sm font-medium text-txt">{t("premiumFeature")}</p>
          <p className="text-xs text-txt-secondary">{t("unlimitedScans")}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update bowl/page.tsx**

Replace the entire content of `src/app/(app)/bowl/page.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";

export default function BowlPage() {
  const t = useTranslations();

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-bold text-txt">{t("bowl")}</h1>
      <h2 className="mb-1 text-xl font-bold text-txt">{t("homeCooking")}</h2>
      <p className="mb-4 text-sm text-txt-secondary">{t("buildMeals")}</p>

      <div className="flex flex-col gap-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icons.preparation className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("mealBuilder")}</p>
            <p className="text-sm text-txt-secondary">{t("mealBuilderDesc")}</p>
          </div>
          <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icons.weight className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-txt">{t("portionCalculator")}</p>
            <p className="text-sm text-txt-secondary">{t("portionCalculatorDesc")}</p>
          </div>
          <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 text-center">
        <Icons.bowl className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
        <p className="font-medium text-txt-secondary">{t("comingSoon")}</p>
        <p className="text-sm text-txt-tertiary">{t("mealPlanningComingSoon")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update learn/page.tsx**

Replace the entire content of `src/app/(app)/learn/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const chipKeys = ["all", "nutrition", "safety", "recipes", "health"] as const;

export default function LearnPage() {
  const t = useTranslations();
  const [activeChip, setActiveChip] = useState("all");

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold text-txt">{t("learn")}</h1>

      <div className="relative mb-4">
        <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-tertiary" aria-hidden="true" />
        <input
          type="text"
          placeholder={t("searchArticles")}
          className="w-full rounded-input border border-border bg-surface py-3 pl-10 pr-4 text-txt opacity-50 outline-none placeholder:text-txt-tertiary"
          disabled
          aria-label={t("searchArticles")}
        />
      </div>

      <h2 className="mb-2 font-semibold text-txt">{t("categories")}</h2>
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {chipKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveChip(key)}
            aria-pressed={activeChip === key}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeChip === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-txt-secondary hover:bg-surface-variant"
            }`}
          >
            {activeChip === key && <Icons.check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
            {t(key)}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Icons.learn className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
        <p className="font-medium text-txt-secondary">{t("knowledgeBase")}</p>
        <p className="text-sm text-txt-tertiary">{t("articlesComingSoon")}</p>
      </div>
    </div>
  );
}
```

Key changes: All emoji → Lucide icons. Disabled search input has `opacity-50` and `aria-label`. Chips have `aria-pressed`. Checkmark uses Icon. Focus-visible on chips. Empty state content vertically centered with `flex-1` on the container.

- [ ] **Step 4b: Vertically center all empty state / placeholder content**

In scan, bowl, and learn pages, wrap the main content area in a flex column that grows to fill the space between the header and bottom nav. Change the outer `<div className="p-4">` to:
```tsx
<div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
```

And wrap the coming-soon / empty-state section in `<div className="flex flex-1 flex-col items-center justify-center">`. This prevents the content from sitting in the top 30% with 70% empty space below.

- [ ] **Step 5: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/\(app\)/profile/page.tsx src/app/\(app\)/scan/page.tsx src/app/\(app\)/bowl/page.tsx src/app/\(app\)/learn/page.tsx && git commit -m "fix: replace emoji with SVG icons in profile and placeholder tabs"
```

---

## Task 11: Replace emoji in auth (forgot-password)

**Files:**
- Modify: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Replace envelope emoji**

In `src/app/(auth)/forgot-password/page.tsx`, add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Replace line 36 (`"✉️"`) with:
```tsx
<Icons.mail className="h-8 w-8 text-safe-text" aria-hidden="true" />
```

- [ ] **Step 2: Add touch target padding to "Back to Sign In" link**

Replace lines 40-42 and 67-69 — both "Back to Sign In" links — by adding `min-h-[44px] inline-flex items-center` to the Link:

```tsx
<Link href="/login" className="min-h-[44px] inline-flex items-center text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-lg">
  {t("backToSignIn")}
</Link>
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/\(auth\)/forgot-password/page.tsx && git commit -m "fix: replace envelope emoji with Mail icon, improve touch targets"
```

---

## Task 12: Fix app layout (responsive max-width)

**Files:**
- Modify: `src/app/(app)/layout.tsx`

This fixes: 69% wasted space on 1440px desktop (audit issue #3, HIGH).

- [ ] **Step 1: Update max-width to be responsive**

In `src/app/(app)/layout.tsx`, replace line 42:

```tsx
<div className="mx-auto min-h-screen max-w-md bg-canvas pb-20">
```

with:

```tsx
<div className="safe-top mx-auto min-h-screen max-w-md bg-canvas pb-20 md:max-w-lg lg:max-w-2xl">
```

This gives:
- Mobile (<768px): 448px max (unchanged)
- Tablet (768px+): 512px max
- Desktop (1024px+): 672px max

- [ ] **Step 2: Also update max-w-md on the BottomNav**

In `src/components/navigation/bottom-nav.tsx`, update the inner div's `max-w-md` to match:

```tsx
<div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:max-w-lg lg:max-w-2xl">
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/\(app\)/layout.tsx src/components/navigation/bottom-nav.tsx && git commit -m "fix: responsive max-width for better desktop space utilization"
```

---

## Task 13: Fix auth layout (Card wrapper, responsive, branding)

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`

This fixes: No card container, no branding, wasted desktop space, touch targets on auth links, missing password visibility toggle.

- [ ] **Step 0: Create PasswordInput component**

Create `src/components/ui/password-input.tsx`:

```tsx
"use client";

import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import { Icons } from "@/components/ui/icon";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = "", id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = error ? `${id}-error` : undefined;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-txt-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={`w-full rounded-input border border-border bg-surface-variant px-4 py-3 pr-12 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${error ? "border-error" : ""} ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-txt-tertiary hover:text-txt focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? (
              <Icons.close className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Icons.search className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
```

Note: The icon for show/hide should use `Eye` and `EyeOff` from lucide-react. Add these to the Icons object in `icon.tsx`:
```tsx
import { Eye, EyeOff } from "lucide-react";
// In the Icons object:
  eye: Eye,
  eyeOff: EyeOff,
```
Then use `Icons.eye` / `Icons.eyeOff` instead of `Icons.close` / `Icons.search` in the toggle.

- [ ] **Step 1: Update auth layout with Card container**

Replace the entire content of `src/app/(auth)/layout.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) router.replace("/search");
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="safe-top flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-sm md:p-8">
        {children}
      </div>
    </div>
  );
}
```

Key changes: Content wrapped in a Card-like container with `bg-surface`, `rounded-card`, `border`, and `shadow-sm`. Added `safe-top`.

- [ ] **Step 2: Add branding to login page**

In `src/app/(auth)/login/page.tsx`, replace lines 34-35 (heading + subtitle):

```tsx
<h1 className="mb-1 text-2xl font-bold text-txt">{t("signIn")}</h1>
<p className="mb-6 text-sm text-txt-secondary">{t("appName")}</p>
```

with:

```tsx
<div className="mb-6 flex flex-col items-center gap-2">
  <Icons.paw className="h-10 w-10 text-primary" aria-hidden="true" />
  <h1 className="text-2xl font-bold text-txt">{t("signIn")}</h1>
  <p className="text-sm text-txt-secondary">{t("appName")}</p>
</div>
```

Add import:
```tsx
import { Icons } from "@/components/ui/icon";
```

Add `min-h-[44px] inline-flex items-center` to the "Forgot Password?" link and "Sign Up" link for touch target compliance.

- [ ] **Step 3: Add branding + touch targets to register page**

In `src/app/(auth)/register/page.tsx`, same branding pattern:

```tsx
<div className="mb-6 flex flex-col items-center gap-2">
  <Icons.paw className="h-10 w-10 text-primary" aria-hidden="true" />
  <h1 className="text-2xl font-bold text-txt">{t("signUp")}</h1>
  <p className="text-sm text-txt-secondary">{t("appName")}</p>
</div>
```

Add import and touch target padding to "Sign In" link.

- [ ] **Step 4: Add branding to forgot-password page**

Same pattern for the forgot password page header.

- [ ] **Step 4b: Replace password Input with PasswordInput in login + register**

In `src/app/(auth)/login/page.tsx`, replace the password `<Input>` with `<PasswordInput>`:
```tsx
import { PasswordInput } from "@/components/ui/password-input";
// ...
<PasswordInput
  label={t("password")}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"
  required
/>
```

In `src/app/(auth)/register/page.tsx`, replace both password `<Input>`s with `<PasswordInput>`:
```tsx
<PasswordInput
  label={t("password")}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="new-password"
  required
/>
<PasswordInput
  label={t("confirmPassword")}
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  autoComplete="new-password"
  required
/>
```

Also add `autoComplete="email"` to all email Input fields across login, register, and forgot-password pages.

- [ ] **Step 5: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/\(auth\)/layout.tsx src/app/\(auth\)/login/page.tsx src/app/\(auth\)/register/page.tsx src/app/\(auth\)/forgot-password/page.tsx && git commit -m "fix: auth layout — card container, branding, touch targets, safe area"
```

---

## Task 14: Fix onboarding safe area

**Files:**
- Modify: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Add safe-top class to onboarding container**

In `src/app/onboarding/page.tsx`, find the outermost container `<div>` and add the `safe-top` class. It should already have `p-4` — just prepend `safe-top`.

- [ ] **Step 2: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/onboarding/page.tsx && git commit -m "fix: add safe area padding to onboarding page"
```

---

## Task 15: Fix Dialog component

**Files:**
- Modify: `src/components/ui/dialog.tsx`

This fixes: Dialog not centered on iOS, no close button, missing aria-labelledby, no safe area, missing backdrop blur (per UI/UX Pro Max design system).

- [ ] **Step 1: Rewrite dialog.tsx**

Replace the entire content of `src/components/ui/dialog.tsx`:

```tsx
"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { Icons } from "@/components/ui/icon";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={titleId}
      className="safe-top m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-border bg-surface p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-txt">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-secondary hover:bg-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icons.close className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
```

Key changes: `m-auto` for centering, `w-[calc(100%-2rem)]` for edge padding, close button with `aria-label`, `aria-labelledby` linking to title, `safe-top` for iOS.

- [ ] **Step 2: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/ui/dialog.tsx && git commit -m "fix: dialog — centering, close button, aria-labelledby, safe area"
```

---

## Task 16: Fix touch targets on all remaining elements

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(app)/search/page.tsx`
- Modify: `src/components/food/food-card.tsx`
- Modify: `src/components/food/category-grid.tsx`

- [ ] **Step 1: Login page touch targets**

In `src/app/(auth)/login/page.tsx`:

"Forgot Password?" link (line 54): add `min-h-[44px] inline-flex items-center` class.

"Sign Up" link (line 73): wrap the parent `<p>` in a `min-h-[44px] flex items-center justify-center` container.

- [ ] **Step 2: Register page touch targets**

Same pattern for "Sign In" link.

- [ ] **Step 3: Search page "Request New Food" touch target**

In the empty state button (line 107), change from `text-sm font-medium text-primary hover:underline` to:

```tsx
className="min-h-[44px] inline-flex items-center rounded-button px-4 text-sm font-medium text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add -A && git commit -m "fix: ensure 44px minimum touch targets on all interactive elements"
```

---

## Task 17: Add missing i18n translation keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Add missing keys to en.json**

Add the following keys to `src/messages/en.json`:

```json
"months": "months",
"kg": "kg",
"intact": "Intact",
"back": "Back",
"foodCount": "{count} foods",
"addPhoto": "Add photo",
"changePhoto": "Change photo",
"petPhoto": "Pet photo",
"passwordMinLength": "Password must be at least 6 characters",
"passwordsNoMatch": "Passwords do not match",
"signInFailed": "Sign in failed",
"signUpFailed": "Sign up failed",
"resetEmailFailed": "Failed to send reset email",
"foodNameMinLength": "Food name must be at least 2 characters",
"foodRequestFailed": "Failed to submit request. Please try again.",
"settings": "Settings",
"bcsTitle": "Rate your dog's body condition (1-9)",
"bcsThin": "Thin",
"bcsIdeal": "Ideal",
"bcsObese": "Obese",
"bcsScore": "Score {score}",
"activityLow": "Low",
"activityLowDesc": "Little to no exercise",
"activityModerate": "Moderate",
"activityModerateDesc": "Regular walks and play",
"activityHigh": "High",
"activityHighDesc": "Very active dog",
"activityWorking": "Working",
"activityWorkingDesc": "High activity or working dog"
```

- [ ] **Step 2: Add matching keys to tr.json**

Add the following Turkish translations to `src/messages/tr.json`:

```json
"months": "ay",
"kg": "kg",
"intact": "Kısırlaştırılmamış",
"back": "Geri",
"foodCount": "{count} yiyecek",
"addPhoto": "Fotoğraf ekle",
"changePhoto": "Fotoğrafı değiştir",
"petPhoto": "Hayvan fotoğrafı",
"passwordMinLength": "Şifre en az 6 karakter olmalı",
"passwordsNoMatch": "Şifreler uyuşmuyor",
"signInFailed": "Giriş başarısız",
"signUpFailed": "Kayıt başarısız",
"resetEmailFailed": "Sıfırlama e-postası gönderilemedi",
"foodNameMinLength": "Yiyecek adı en az 2 karakter olmalı",
"foodRequestFailed": "Talep gönderilemedi. Lütfen tekrar deneyin.",
"settings": "Ayarlar",
"bcsTitle": "Köpeğinizin vücut kondisyonunu değerlendirin (1-9)",
"bcsThin": "Zayıf",
"bcsIdeal": "İdeal",
"bcsObese": "Obez",
"bcsScore": "Skor {score}",
"activityLow": "Düşük",
"activityLowDesc": "Az veya hiç egzersiz yok",
"activityModerate": "Orta",
"activityModerateDesc": "Düzenli yürüyüş ve oyun",
"activityHigh": "Yüksek",
"activityHighDesc": "Çok aktif köpek",
"activityWorking": "Çalışan",
"activityWorkingDesc": "Yüksek aktivite veya çalışan köpek"
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/messages/en.json src/messages/tr.json && git commit -m "feat: add missing i18n translation keys for all hardcoded strings"
```

---

## Task 18: Replace hardcoded strings with t() calls

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`
- Modify: `src/components/food/food-request-dialog.tsx`
- Modify: `src/components/pet/bcs-slider.tsx`
- Modify: `src/components/pet/photo-picker.tsx`

Note: `pet-card.tsx` and `category/page.tsx` were already fixed in Tasks 8 and 9.

- [ ] **Step 1: Fix register/page.tsx hardcoded strings**

In `src/app/(auth)/register/page.tsx`:

Replace line 25:
```tsx
setError("Password must be at least 6 characters");
```
with:
```tsx
setError(t("passwordMinLength"));
```

Replace line 29:
```tsx
setError("Passwords do not match");
```
with:
```tsx
setError(t("passwordsNoMatch"));
```

Replace line 36:
```tsx
setError(err instanceof Error ? err.message : "Sign up failed");
```
with:
```tsx
setError(err instanceof Error ? err.message : t("signUpFailed"));
```

- [ ] **Step 2: Fix login/page.tsx hardcoded strings**

In `src/app/(auth)/login/page.tsx`, replace line 26:
```tsx
setError(err instanceof Error ? err.message : "Sign in failed");
```
with:
```tsx
setError(err instanceof Error ? err.message : t("signInFailed"));
```

- [ ] **Step 3: Fix forgot-password/page.tsx hardcoded strings**

Replace line 26:
```tsx
setError(err instanceof Error ? err.message : "Failed to send reset email");
```
with:
```tsx
setError(err instanceof Error ? err.message : t("resetEmailFailed"));
```

- [ ] **Step 4: Fix food-request-dialog.tsx hardcoded strings**

Replace line 30:
```tsx
"Food name must be at least 2 characters"
```
with:
```tsx
t("foodNameMinLength")
```

Replace line 37:
```tsx
"Failed to submit request. Please try again."
```
with:
```tsx
t("foodRequestFailed")
```

- [ ] **Step 5: Fix bcs-slider.tsx hardcoded strings + ARIA**

In `src/components/pet/bcs-slider.tsx`, replace:
- `"Rate your dog's body condition (1-9)"` → `t("bcsTitle")`
- `"1 Thin"` → `"1 " + t("bcsThin")`
- `"5 Ideal"` → `"5 " + t("bcsIdeal")`
- `"9 Obese"` → `"9 " + t("bcsObese")`
- `"Score {bcs.score}"` → `t("bcsScore", { score: bcs.score })`

Also add ARIA attributes to the `<input type="range">` element:
```tsx
<input
  type="range"
  min={1}
  max={9}
  value={value}
  onChange={(e) => onChange(Number(e.target.value))}
  aria-label={t("bodyConditionScore")}
  aria-valuemin={1}
  aria-valuemax={9}
  aria-valuenow={value}
  aria-valuetext={bcs ? `${t("bcsScore", { score: value })} - ${bcs.label}` : undefined}
  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
/>
```

- [ ] **Step 6: Fix photo-picker.tsx hardcoded text**

Replace `"Add photo"` with `{t("addPhoto")}` and `"Pet photo"` with `{t("petPhoto")}`.

- [ ] **Step 7: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 8: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add -A && git commit -m "fix: replace all hardcoded English strings with i18n t() calls"
```

---

## Task 19: Rewrite BreedSelector with combobox accessibility

**Files:**
- Modify: `src/components/pet/breed-selector.tsx`

This fixes: CRITICAL — BreedSelector has no keyboard navigation, no combobox ARIA, no "no results" feedback, doesn't close on outside click/Escape.

- [ ] **Step 1: Rewrite breed-selector.tsx**

Replace the entire content of `src/components/pet/breed-selector.tsx`:

```tsx
"use client";

import { useState, useMemo, useRef, useEffect, useId } from "react";
import { DOG_BREEDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface BreedSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function BreedSelector({ value, onChange }: BreedSelectorProps) {
  const t = useTranslations();
  const [search, setSearch] = useState(value ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listboxId = useId();

  const filtered = useMemo(() => {
    if (!search) return DOG_BREEDS;
    const lower = search.toLowerCase();
    return DOG_BREEDS.filter((b) => b.toLowerCase().includes(lower)).slice(0, 20);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const el = listboxRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      setActiveIndex(0);
      e.preventDefault();
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          onChange(filtered[activeIndex]);
          setSearch(filtered[activeIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-txt-secondary">
        {t("petBreed")}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => { if (search) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={t("selectBreed")}
        className="rounded-input border border-border bg-surface-variant px-4 py-3 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      {isOpen && search && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-card border border-border bg-surface shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((breed, i) => (
              <div
                key={breed}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={value === breed}
                onClick={() => {
                  onChange(breed);
                  setSearch(breed);
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  i === activeIndex ? "bg-primary/10 text-primary" : ""
                } ${value === breed ? "font-medium text-primary" : "text-txt"} hover:bg-surface-variant`}
              >
                {breed}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-txt-tertiary">
              {t("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

Key changes: Full combobox ARIA pattern. Arrow key + Enter + Escape keyboard navigation. Outside-click-to-close. "No results" feedback. `role="listbox"` / `role="option"`. `aria-expanded`, `aria-controls`, `aria-activedescendant`. Proper `<label htmlFor>`.

- [ ] **Step 2: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/pet/breed-selector.tsx && git commit -m "fix: rewrite BreedSelector with full combobox accessibility pattern"
```

---

## Task 20: Add Lora + Raleway typography

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.js`
- Modify: `src/app/layout.tsx`

This adds: Professional typography recommended by UI/UX Pro Max for health/wellness apps.

- [ ] **Step 1: Add Google Fonts import to globals.css**

In `src/app/globals.css`, add at the top before `@import "tailwindcss"`:

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap');
```

- [ ] **Step 2: Add font-family theme tokens to globals.css**

Inside the `@theme` block, add:

```css
  --font-heading: 'Lora', Georgia, serif;
  --font-body: 'Raleway', system-ui, sans-serif;
```

- [ ] **Step 3: Apply fonts globally**

In `src/app/layout.tsx`, add `font-family` via the root `<html>` or `<body>` class. If using Tailwind, add to the `<body>`:

```tsx
<body className="font-body antialiased">
```

And add a Tailwind utility for headings. In `src/app/globals.css` after the theme block:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/app/globals.css tailwind.config.js src/app/layout.tsx && git commit -m "feat: add Lora + Raleway typography for wellness brand identity"
```

---

## Task 21: Onboarding multi-step wizard with progress indicator

**Files:**
- Create: `src/components/ui/progress-steps.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/pet/pet-form.tsx`

This fixes: No progress indicator, submit button below fold on all devices, form too long for single page.

- [ ] **Step 1: Create ProgressSteps component**

Create `src/components/ui/progress-steps.tsx`:

```tsx
interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`h-1.5 w-full rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-border"
            }`}
          />
          <span className={`text-[10px] ${i <= currentStep ? "text-primary font-medium" : "text-txt-tertiary"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Convert PetForm to multi-step**

In `src/components/pet/pet-form.tsx`, add step state and navigation:

```tsx
const [step, setStep] = useState(0);
const stepLabels = [t("petName"), t("petGender"), t("activityLevel")];
```

Organize fields into 3 steps:
- **Step 0 — Identity:** PhotoPicker, Name, Breed, Age, Weight
- **Step 1 — Demographics:** Gender, Neutered
- **Step 2 — Health:** Activity Level, BCS

Show only the fields for the current step. Replace the single submit button with:
- Steps 0-1: "Next" button (type="button")
- Step 2: Submit button (type="submit")
- Steps 1-2: "Back" text button

```tsx
<div className="flex gap-3">
  {step > 0 && (
    <Button variant="outline" type="button" onClick={() => setStep(step - 1)}>
      {t("back")}
    </Button>
  )}
  {step < 2 ? (
    <Button type="button" fullWidth onClick={() => setStep(step + 1)}>
      {t("next")}
    </Button>
  ) : (
    <Button type="submit" fullWidth isLoading={isLoading}>
      {pet ? t("saveChanges") : t("getStarted")}
    </Button>
  )}
</div>
```

- [ ] **Step 3: Add ProgressSteps to onboarding page**

In `src/app/onboarding/page.tsx`, import and render ProgressSteps above the PetForm:

```tsx
import { ProgressSteps } from "@/components/ui/progress-steps";
// ...
<ProgressSteps steps={["Info", "Details", "Health"]} currentStep={currentStep} />
```

Pass `currentStep` from PetForm via a callback prop or lift the step state to the onboarding page.

- [ ] **Step 4: Add "next" translation key**

In `en.json`: `"next": "Next"`
In `tr.json`: `"next": "İleri"`

- [ ] **Step 5: Build and verify**

```bash
cd /Users/hamzasahin/src/petpal/web && npm run build
```

- [ ] **Step 6: Commit**

```bash
cd /Users/hamzasahin/src/petpal/web && git add src/components/ui/progress-steps.tsx src/app/onboarding/page.tsx src/components/pet/pet-form.tsx src/messages/en.json src/messages/tr.json && git commit -m "feat: convert onboarding to multi-step wizard with progress indicator"
```

---

## Post-Implementation: Run /qa

After all 18 tasks are complete:

- [ ] **Run the `/qa` skill** to verify all changes across browser and iOS simulator
- [ ] **Run the `/ui-ux-pro-max` pre-delivery checklist:**
  - [ ] No emojis used as icons (use SVG instead)
  - [ ] All icons from consistent icon set (Lucide)
  - [ ] Hover states don't cause layout shift
  - [ ] All clickable elements have `cursor-pointer` or are `<button>`/`<a>`
  - [ ] Transitions are smooth (150-300ms)
  - [ ] Focus states visible for keyboard navigation
  - [ ] Light mode text has sufficient contrast (4.5:1 minimum)
  - [ ] Responsive at 375px, 768px, 1024px, 1440px
  - [ ] No horizontal scroll on mobile

---

## Summary

| Task | Description | Issues Fixed |
|------|-------------|-------------|
| 1 | Install lucide-react | Foundation for all icon work |
| 2 | iOS safe area + viewport-fit + cursor-pointer + reduced-motion | #2 CRITICAL — Dynamic Island collision, cursor-pointer anti-pattern, motion a11y |
| 3 | Button contrast ratio | WCAG AA compliance, focus-visible rings |
| 4 | Input component upgrade | Auto-ID, aria-describedby, focus-visible, error alerts |
| 5 | Icon component + constants | Foundation for emoji replacement |
| 6 | BottomNav fixes | Bowl icon, aria-label, aria-current, touch targets, label size |
| 7 | Food component emoji → SVG | Safety badge, food card, category grid, focus-visible |
| 8 | Pet component emoji → SVG + ARIA roles | Pet card, photo picker, activity selector, gender toggle radiogroup, inputmode, image lazy loading |
| 9 | Search pages emoji → SVG | Search home, food detail, category browse, aria-labels |
| 10 | Profile + tabs emoji → SVG + empty state centering | Profile, scan, bowl, learn, vertically centered placeholders |
| 11 | Auth emoji → SVG | Forgot password envelope, touch targets |
| 12 | App layout responsive | #3 HIGH — desktop wasted space |
| 13 | Auth layout Card + branding + password toggle | #4 HIGH — no branding, no card, PasswordInput component |
| 14 | Onboarding safe area | Safe area for onboarding page |
| 15 | Dialog component | Centering, close button, aria-labelledby, backdrop blur, safe area |
| 16 | Touch targets | #7 CRITICAL — 44px minimum |
| 17 | i18n keys | #6 HIGH — add missing keys |
| 18 | Hardcoded strings → t() + BCS ARIA | #6 HIGH — replace in components, slider aria-valuetext |
| 19 | BreedSelector accessibility rewrite | CRITICAL — combobox pattern, keyboard nav, no-results feedback |
| 20 | Typography (Lora + Raleway) | Brand identity, wellness font pairing |
| 21 | Onboarding multi-step wizard | Progress indicator, submit above fold, step navigation |
