# Hide Scanner & Rename Tiers — Design Spec

**Date:** 2026-04-15
**Goal:** Prepare UI for App Store launch by hiding unimplemented scanner feature and simplifying subscription tiers.
**Scope:** UI-only. No DB, API, type, or entitlement logic changes.

---

## Changes

### 1. BottomNav (`src/components/navigation/bottom-nav.tsx`)

- Remove `scanner` entry from `tabs` array (the `{ key: "scanner", href: "/scan", label: "scanner" }` item)
- Remaining 4 tabs: Recipes | Search (center FAB) | Learn | Profile
- Center FAB index shifts from `2` to `1` — update center detection logic accordingly
- Remove scanner SVG icon definition

### 2. PaywallSheet (`src/components/subscription/PaywallSheet.tsx`)

- Remove Premium plan card and its pricing (`$9.99/mo`, `$79.99/yr`)
- Rename Basic display → "Pro"
- Remove `scanner` context from `PLAN_FEATURES` — only `recipe` context remains
- Remove scanner feature strings from feature list (`scanLabels`, `aiIngredientBreakdown`)
- Simplify layout to single-plan view:
  - Title ("Unlock Pro")
  - Feature list
  - Monthly / Annual toggle with savings badge (min 44px touch targets, 8px gap)
  - Price display
  - Single CTA button (full-width, prominent)
- No more plan comparison cards — single-plan layout reduces cognitive load

### 3. SubscriptionCard (`src/components/subscription/SubscriptionCard.tsx`)

- When `subscriptionTier === "BASIC"`, display "Pro" (via `t("basicPlan")` — translation value changes)
- Remove any `PREMIUM` tier display branch/conditional

### 4. Profile Page (`src/app/(app)/profile/page.tsx`)

- Tier badge: `BASIC` shows "Pro" (via translation key)
- Remove scan history menu item (`{ href: "/profile/scan-history", ... }`)
- PaywallSheet `requiredTier` stays `"basic"` internally

### 5. Translations (`src/messages/en.json`, `src/messages/tr.json`)

**Value changes:**
- `basicPlan`: "Basic" → "Pro" (EN), Turkish equivalent (TR)
- `basicPlanDesc`: Update to remove any scanner mentions
- `unlockRecipes` / `unlockRecipesDesc`: Review wording (now the only paywall context)

**Kept but unused (no deletion):**
- Scanner keys: `scannerTitle`, `scanFoodLabels`, `scanDescription`, `howItWorks`, `scanStep1-3`, `unlockScanner`, `includedWithPremium`
- Premium keys: `premiumPlan`, `premiumPlanDesc`

### 6. Entitlements & Access (`src/lib/entitlements.ts`, `src/lib/access.ts`)

- **No changes.** Internal `"basic"` / `"premium"` / `"scanner.scan"` mappings stay.

### 7. Scan Pages (`src/app/(app)/scan/`, `src/app/(app)/profile/scan-history/`)

- **No deletion.** Pages remain in codebase, just unreachable from UI navigation.

### 8. API Routes & Hooks

- **No changes.** `use-purchases.ts`, `use-entitlement.ts`, `sync-entitlements`, `revenuecat webhook` all untouched.

---

## What Does NOT Change

- TypeScript types (`SubscriptionTier` enum stays `FREE | BASIC | PREMIUM`)
- Zod schemas
- Supabase tables or RPC functions
- Entitlement mapping logic
- API routes
- RevenueCat integration
- `use-purchases.ts` hook (still has `"basic" | "premium"` plan keys internally)
- Scan page files (just unreachable)

## Risks

- **Direct URL access:** User could still navigate to `/scan` directly. Acceptable — page shows paywall anyway, and scanner is non-functional.
- **Future re-enable:** Scanner code preserved. Re-adding tab to BottomNav + Premium plan to PaywallSheet restores feature.
