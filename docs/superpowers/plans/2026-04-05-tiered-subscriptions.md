# Tiered Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement end-to-end tiered subscriptions (Guest/Free/Basic/Premium) with RevenueCat, App Store Connect integration, paywall UI, and access control.

**Architecture:** RevenueCat SDK (iOS via Capacitor plugin + web via RC Billing) handles all purchase flows. A webhook endpoint syncs subscription state to Supabase `user_metadata`. Client-side entitlements map gates actions to tiers. Two-layer access: route gate (login) + action gate (paywall).

**Tech Stack:** Next.js 15, RevenueCat (`@revenuecat/purchases-capacitor`), Capacitor 8, Zustand, Supabase, Tailwind CSS 4, next-intl.

**External IDs:**
- App Store Connect app: `6761324827` (Paw Balance, `com.pawbalance.app`)
- RevenueCat project: `projc65eb1f1`
- RevenueCat test store app: `app8c934ec48f`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/entitlements.ts` | ACTION_ENTITLEMENTS map, `canPerform()`, `getRequiredTier()` |
| `src/hooks/use-entitlement.ts` | `useEntitlement()` hook: `canPerform()`, `guardAction()`, paywall state |
| `src/hooks/use-purchases.ts` | RevenueCat SDK wrapper: init, purchase, restore, entitlements sync |
| `src/components/subscription/PaywallSheet.tsx` | Bottom sheet paywall with plan comparison |
| `src/components/subscription/SubscriptionBanner.tsx` | Trial expiry + billing issue banners |
| `src/components/subscription/SubscriptionCard.tsx` | Profile subscription management card |
| `src/app/api/webhooks/revenuecat/route.ts` | Webhook handler for subscription events |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `BASIC` to SubscriptionTier enum |
| `src/lib/access.ts` | Relax routes to `guest`, add `BASIC` to `resolveUserTier()` |
| `src/store/auth-store.ts` | Add `subscriptionExpiry`, `isTrialing`, `hasBillingIssue`; new `setSubscription()` action |
| `src/app/providers.tsx` | Init RevenueCat SDK on mount |
| `src/app/(app)/layout.tsx` | Replace hardcoded paywall with `SubscriptionBanner`; render children for soft gates |
| `src/app/(app)/recipes/page.tsx` | Gate "New Recipe" button with `guardAction("recipes.create")` |
| `src/app/(app)/recipes/new/page.tsx` | Gate form submission |
| `src/app/(app)/recipes/analysis/page.tsx` | Gate "Run Analysis" / auto-analyze |
| `src/app/(app)/scan/page.tsx` | Gate "Start Scan" with `guardAction("scanner.scan")` |
| `src/app/(app)/profile/page.tsx` | Replace placeholder subscription link with `SubscriptionCard` |
| `src/app/api/recipes/analyze/route.ts` | Add server-side subscription check |
| `package.json` | Add `@revenuecat/purchases-capacitor` |
| `messages/en.json` | Add subscription i18n keys |
| `messages/tr.json` | Add subscription i18n keys (Turkish) |

---

### Task 1: App Store Connect — Create Subscription Group & Products

**Files:** None (MCP-only task)

This task uses the App Store Connect MCP tools to create the subscription group and 4 products. The subscription group and products must exist before RevenueCat can reference them.

- [ ] **Step 1: Create subscription group "PawBalance Pro"**

Use the App Store Connect MCP tool to create a subscription group on app `6761324827` with reference name "PawBalance Pro".

Note: The App Store Connect API requires creating subscriptions (not just a group). Each subscription is created within a group. The first subscription creates the group implicitly.

- [ ] **Step 2: Create 4 subscription products**

Create each subscription product via MCP. Product IDs:
- `com.pawbalance.basic.monthly` — "PawBalance Basic (Monthly)", $6.99
- `com.pawbalance.basic.annual` — "PawBalance Basic (Annual)", $55.99
- `com.pawbalance.premium.monthly` — "PawBalance Premium (Monthly)", $9.99
- `com.pawbalance.premium.annual` — "PawBalance Premium (Annual)", $79.99

Each with a 7-day free trial offer. All in the same subscription group.

- [ ] **Step 3: Add localized descriptions**

For each product, add EN and TR localizations:
- Basic: EN "AI-powered recipe analysis for your dog" / TR "Köpeğiniz için yapay zeka destekli tarif analizi"
- Premium: EN "Recipe analysis + food label scanner" / TR "Tarif analizi + gıda etiketi tarayıcı"

- [ ] **Step 4: Verify products exist**

List subscription groups for app `6761324827` to confirm all 4 products are created.

- [ ] **Step 5: Commit**

No code changes — this is an external configuration step. Record the product IDs in a commit message for traceability.

```bash
git commit --allow-empty -m "chore: create App Store Connect subscription group and 4 products

Products created via App Store Connect API:
- com.pawbalance.basic.monthly ($6.99)
- com.pawbalance.basic.annual ($55.99)
- com.pawbalance.premium.monthly ($9.99)
- com.pawbalance.premium.annual ($79.99)
All in 'PawBalance Pro' subscription group with 7-day free trial."
```

---

### Task 2: RevenueCat — Create App, Products, Entitlements, Offering

**Files:** None (MCP-only task)

- [ ] **Step 1: Create Apple App Store app in RevenueCat**

Use `mcp__revenuecat__create-app` with:
- `project_id`: `projc65eb1f1`
- `name`: "PawBalance iOS"
- `type`: `app_store`
- `app_store_app_id`: `6761324827`

Record the returned `app_id`.

- [ ] **Step 2: Create 4 products in RevenueCat**

Use `mcp__revenuecat__create-product` for each:
- `app_id`: (from step 1)
- `store_identifier`: `com.pawbalance.basic.monthly` (and the other 3)
- `display_name`: descriptive name for each

- [ ] **Step 3: Create entitlements**

Use `mcp__revenuecat__create-entitlement` twice:
- `lookup_key`: `basic`, `display_name`: "Basic"
- `lookup_key`: `premium`, `display_name`: "Premium"

- [ ] **Step 4: Attach products to entitlements**

Use `mcp__revenuecat__attach-products-to-entitlement`:
- `basic` entitlement: attach all 4 products (Basic + Premium products)
- `premium` entitlement: attach only the 2 Premium products

- [ ] **Step 5: Create offering and packages**

Use `mcp__revenuecat__create-offering`:
- `lookup_key`: `default`, `display_name`: "Default"

Use `mcp__revenuecat__create-packages`:
- Package `basic` with `display_name`: "Basic"
- Package `premium` with `display_name`: "Premium"

- [ ] **Step 6: Attach products to packages**

Use `mcp__revenuecat__attach-products-to-package`:
- `basic` package: attach `com.pawbalance.basic.monthly` and `com.pawbalance.basic.annual`
- `premium` package: attach `com.pawbalance.premium.monthly` and `com.pawbalance.premium.annual`

- [ ] **Step 7: Configure webhook**

Use `mcp__revenuecat__create-webhook-integration`:
- `url`: `https://pawbalance.optalgo.com/api/webhooks/revenuecat`
- Events: all subscription events

- [ ] **Step 8: Get API keys**

Use `mcp__revenuecat__list-app-public-api-keys` to get the public API key for the iOS app. Record it — this will be `NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY`.

- [ ] **Step 9: Verify setup**

Use `mcp__revenuecat__list-offerings` with `expand: ["items.package", "items.package.product"]` to verify the full offering tree.

- [ ] **Step 10: Commit**

```bash
git commit --allow-empty -m "chore: configure RevenueCat project — entitlements, offerings, webhook

RevenueCat project projc65eb1f1 configured via API:
- Apple App Store app linked
- 4 products, 2 entitlements (basic, premium)
- Default offering with Basic and Premium packages
- Webhook configured for pawbalance.optalgo.com"
```

---

### Task 3: Update Types & Access Control Layer

**Files:**
- Modify: `src/lib/types.ts:7`
- Modify: `src/lib/access.ts`
- Create: `src/lib/entitlements.ts`

- [ ] **Step 1: Add BASIC to SubscriptionTier enum**

In `src/lib/types.ts`, change line 7:

```typescript
export const SubscriptionTier = z.enum(["FREE", "BASIC", "PREMIUM"]);
```

- [ ] **Step 2: Update access.ts — relax routes and handle BASIC tier**

Replace the full contents of `src/lib/access.ts`:

```typescript
import type { Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

export type AccessTier = "guest" | "free" | "basic" | "premium";

const TIER_LEVEL: Record<AccessTier, number> = {
  guest: 0,
  free: 1,
  basic: 2,
  premium: 3,
};

/**
 * Maps route prefixes to the minimum tier required to access them.
 * Recipes and Scan are guest-accessible (soft gate — paywall on action).
 */
const ROUTE_ACCESS: Record<string, AccessTier> = {
  "/search": "guest",
  "/learn": "guest",
  "/profile": "free",
  "/recipes": "guest",
  "/scan": "guest",
};

export function resolveUserTier(
  session: Session | null,
  subscriptionTier: SubscriptionTier,
): AccessTier {
  if (!session) return "guest";
  switch (subscriptionTier) {
    case "PREMIUM":
      return "premium";
    case "BASIC":
      return "basic";
    default:
      return "free";
  }
}

export function getRequiredTier(pathname: string): AccessTier {
  const match = Object.keys(ROUTE_ACCESS)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_ACCESS[match] : "guest";
}

export function canAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

export function getAccessGateReason(
  session: Session | null,
  userTier: AccessTier,
  requiredTier: AccessTier,
): "none" | "login" | "paywall" {
  if (canAccess(userTier, requiredTier)) return "none";
  if (!session) return "login";
  return "paywall";
}
```

- [ ] **Step 3: Create entitlements.ts**

Create `src/lib/entitlements.ts`:

```typescript
import type { AccessTier } from "@/lib/access";

/**
 * Maps action identifiers to the minimum tier required.
 * Single source of truth for all action-level gating.
 */
export const ACTION_ENTITLEMENTS: Record<string, AccessTier> = {
  "recipes.read": "free",
  "recipes.create": "basic",
  "recipes.edit": "basic",
  "recipes.analyze": "basic",
  "scanner.scan": "premium",
};

/** Check if a given tier can perform an action. */
export function canPerform(userTier: AccessTier, action: string): boolean {
  const required = ACTION_ENTITLEMENTS[action];
  if (!required) return true; // unknown actions are unrestricted
  const levels: Record<AccessTier, number> = {
    guest: 0,
    free: 1,
    basic: 2,
    premium: 3,
  };
  return levels[userTier] >= levels[required];
}

/** Get the minimum tier required for an action. */
export function getRequiredTier(action: string): AccessTier {
  return ACTION_ENTITLEMENTS[action] ?? "guest";
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

Expected: Build succeeds. No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/access.ts src/lib/entitlements.ts
git commit -m "feat: add BASIC tier and action-level entitlements map

- Add BASIC to SubscriptionTier enum
- Relax /recipes and /scan routes to guest (soft gate)
- Add resolveUserTier BASIC handling
- Create entitlements.ts with ACTION_ENTITLEMENTS map"
```

---

### Task 4: Update Auth Store with Subscription Fields

**Files:**
- Modify: `src/store/auth-store.ts`

- [ ] **Step 1: Add subscription fields and setSubscription action**

Replace `src/store/auth-store.ts`:

```typescript
import { create } from "zustand";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: string | null;
  isTrialing: boolean;
  hasBillingIssue: boolean;
  isLoading: boolean;
  setAuth: (user: SupabaseUser | null, session: Session | null) => void;
  setSubscription: (tier: SubscriptionTier, expiry: string | null, isTrialing: boolean) => void;
  setBillingIssue: (has: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  subscriptionTier: "FREE",
  subscriptionExpiry: null,
  isTrialing: false,
  hasBillingIssue: false,
  isLoading: true,

  setAuth: (user, session) =>
    set({
      user,
      session,
      subscriptionTier:
        (user?.user_metadata?.subscription_tier as SubscriptionTier) ?? "FREE",
      subscriptionExpiry: user?.user_metadata?.subscription_expiry ?? null,
      isLoading: false,
    }),

  setSubscription: (subscriptionTier, subscriptionExpiry, isTrialing) =>
    set({ subscriptionTier, subscriptionExpiry, isTrialing }),

  setBillingIssue: (hasBillingIssue) => set({ hasBillingIssue }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({
      user: null,
      session: null,
      subscriptionTier: "FREE",
      subscriptionExpiry: null,
      isTrialing: false,
      hasBillingIssue: false,
      isLoading: false,
    }),
}));
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/store/auth-store.ts
git commit -m "feat: add subscription fields to auth store

Add subscriptionExpiry, isTrialing, hasBillingIssue fields.
Add setSubscription() and setBillingIssue() actions for
RevenueCat SDK to update tier without full auth refresh."
```

---

### Task 5: Install RevenueCat & Create use-purchases Hook

**Files:**
- Modify: `package.json`
- Create: `src/hooks/use-purchases.ts`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Install RevenueCat Capacitor plugin**

```bash
npm install @revenuecat/purchases-capacitor
```

- [ ] **Step 2: Create use-purchases.ts**

Create `src/hooks/use-purchases.ts`:

```typescript
import { useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { isNative } from "@/lib/platform";
import type { SubscriptionTier } from "@/lib/types";

// RevenueCat package identifiers
const PACKAGE_IDS = {
  basic: { monthly: "$rc_monthly", annual: "$rc_annual" },
  premium: { monthly: "$rc_monthly", annual: "$rc_annual" },
} as const;

type Period = "monthly" | "annual";
type PlanKey = "basic" | "premium";

/** Map RevenueCat entitlements to our SubscriptionTier. */
function mapEntitlements(entitlements: Record<string, { isActive: boolean }>): {
  tier: SubscriptionTier;
  expiry: string | null;
  isTrialing: boolean;
} {
  const premium = entitlements["premium"];
  const basic = entitlements["basic"];

  if (premium?.isActive) {
    const info = premium as any;
    return {
      tier: "PREMIUM",
      expiry: info.expirationDate ?? null,
      isTrialing: info.periodType === "TRIAL",
    };
  }
  if (basic?.isActive) {
    const info = basic as any;
    return {
      tier: "BASIC",
      expiry: info.expirationDate ?? null,
      isTrialing: info.periodType === "TRIAL",
    };
  }
  return { tier: "FREE", expiry: null, isTrialing: false };
}

/** Sync RevenueCat entitlements to Zustand store. */
export async function syncEntitlements(): Promise<void> {
  if (!isNative) return;

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.getCustomerInfo();
  const { tier, expiry, isTrialing } = mapEntitlements(
    customerInfo.entitlements.active as any,
  );
  useAuthStore.getState().setSubscription(tier, expiry, isTrialing);
}

/** Initialize RevenueCat SDK. Call once on app startup. */
export async function initPurchases(userId?: string): Promise<void> {
  if (!isNative) return;

  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY;
  if (!apiKey) return;

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  await Purchases.configure({ apiKey });

  if (userId) {
    await Purchases.logIn({ appUserID: userId });
  }

  await syncEntitlements();
}

export function usePurchases() {
  const { setSubscription, setBillingIssue } = useAuthStore();

  const purchase = useCallback(
    async (plan: PlanKey, period: Period): Promise<boolean> => {
      if (!isNative) {
        // Web: open RevenueCat billing portal (future implementation)
        return false;
      }

      const { Purchases } = await import("@revenuecat/purchases-capacitor");

      try {
        const { offerings } = await Purchases.getOfferings();
        const current = offerings.current;
        if (!current) throw new Error("No offerings available");

        const pkg = plan === "premium"
          ? (period === "annual" ? current.annual : current.monthly)
          : (period === "annual" ? current.sixMonth : current.monthly);

        // Find the correct package from the offering
        const targetPkg = current.availablePackages.find((p) => {
          const id = p.product.identifier;
          return id.includes(plan) && id.includes(period === "annual" ? "annual" : "monthly");
        });

        if (!targetPkg) throw new Error(`Package not found: ${plan} ${period}`);

        const { customerInfo } = await Purchases.purchasePackage({
          aPackage: targetPkg,
        });

        const result = mapEntitlements(customerInfo.entitlements.active as any);
        setSubscription(result.tier, result.expiry, result.isTrialing);
        return true;
      } catch (err: any) {
        if (err.userCancelled) return false;
        throw err;
      }
    },
    [setSubscription],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const result = mapEntitlements(customerInfo.entitlements.active as any);
    setSubscription(result.tier, result.expiry, result.isTrialing);
    return result.tier !== "FREE";
  }, [setSubscription]);

  const manageSubscription = useCallback(async () => {
    if (isNative) {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      await Purchases.showManageSubscriptions();
    }
    // Web: redirect to Stripe portal (future)
  }, []);

  return { purchase, restore, manageSubscription, syncEntitlements };
}
```

- [ ] **Step 3: Initialize RevenueCat in providers.tsx**

Modify `src/app/providers.tsx` — add RevenueCat init after auth listener:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthListener } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { initOtaUpdates, setOnUpdateReady, reloadApp, isNative } from "@/lib/platform";
import { initPurchases, syncEntitlements } from "@/hooks/use-purchases";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthListener();
  const t = useTranslations();
  const [updateReady, setUpdateReady] = useState(false);

  // Init OTA updates
  useEffect(() => {
    setOnUpdateReady(() => setUpdateReady(true));
    initOtaUpdates();
  }, []);

  // Init RevenueCat after auth is ready
  const { session, isLoading } = useAuthStore();
  useEffect(() => {
    if (isLoading) return;
    initPurchases(session?.user?.id);
  }, [isLoading, session?.user?.id]);

  // Re-sync entitlements on app foreground
  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) syncEntitlements();
      });
      cleanup = () => listener.remove();
    })();

    return () => cleanup?.();
  }, []);

  // Web: periodic re-sync every 15 minutes
  useEffect(() => {
    if (isNative) return;
    const interval = setInterval(syncEntitlements, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children}
      {updateReady && (
        <div className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-lg">
            <p className="flex-1 text-sm font-medium text-txt">
              {t("updateReady")}
            </p>
            <button
              onClick={() => reloadApp()}
              className="shrink-0 rounded-button bg-primary-btn px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out active:scale-95"
            >
              {t("updateNow")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 5: Sync Capacitor**

```bash
npx cap sync ios
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/hooks/use-purchases.ts src/app/providers.tsx
git commit -m "feat: add RevenueCat SDK integration and use-purchases hook

- Install @revenuecat/purchases-capacitor
- Create use-purchases hook (purchase, restore, manage, sync)
- Init RevenueCat in providers after auth
- Sync entitlements on app foreground + web periodic check"
```

---

### Task 6: Create useEntitlement Hook

**Files:**
- Create: `src/hooks/use-entitlement.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-entitlement.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { resolveUserTier, type AccessTier } from "@/lib/access";
import { canPerform as checkCanPerform, getRequiredTier } from "@/lib/entitlements";

export function useEntitlement() {
  const { session, subscriptionTier } = useAuthStore();
  const userTier = resolveUserTier(session, subscriptionTier);
  const [paywallAction, setPaywallAction] = useState<string | null>(null);

  const canPerform = useCallback(
    (action: string): boolean => checkCanPerform(userTier, action),
    [userTier],
  );

  /**
   * Check if user can perform an action. If not, opens paywall.
   * Returns true if action is allowed, false if paywall was shown.
   */
  const guardAction = useCallback(
    (action: string): boolean => {
      if (checkCanPerform(userTier, action)) return true;

      // Unauthenticated users need to log in first, not see paywall
      if (!session) return false;

      setPaywallAction(action);
      return false;
    },
    [userTier, session],
  );

  const dismissPaywall = useCallback(() => setPaywallAction(null), []);

  /** The tier that the paywall should pre-select. */
  const paywallTier: AccessTier | null = paywallAction
    ? getRequiredTier(paywallAction)
    : null;

  return {
    canPerform,
    guardAction,
    paywallAction,
    paywallTier,
    dismissPaywall,
    isPaywallOpen: paywallAction !== null,
  };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-entitlement.ts
git commit -m "feat: add useEntitlement hook for action-level gating

Provides canPerform() for checks and guardAction() which
opens paywall if user's tier is insufficient."
```

---

### Task 7: Add i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/tr.json`

- [ ] **Step 1: Add English keys**

Add these keys to `messages/en.json` (find the appropriate location in the existing JSON structure):

```json
"unlockRecipes": "Unlock Recipes",
"unlockRecipesDesc": "Create custom recipes with AI-powered nutrition analysis for your dog",
"unlockScanner": "Unlock Scanner",
"unlockScannerDesc": "Scan pet food labels for instant AI-powered safety analysis",
"freeTrialBadge": "7-day free trial",
"monthly": "Monthly",
"annual": "Annual",
"savePct": "Save {pct}%",
"basicPlan": "Basic",
"basicPlanDesc": "AI recipe analysis",
"premiumPlan": "Premium",
"premiumPlanDesc": "Everything + label scanner",
"mostPopular": "Most Popular",
"bestValue": "Best Value",
"perMonth": "/month",
"perYear": "/year",
"perMonthEquiv": "{price}/month",
"whatsIncluded": "What's included",
"startFreeTrial": "Start Free Trial",
"afterTrial": "After trial, {price}/{period}. Cancel anytime.",
"restorePurchase": "Restore purchase",
"swipeToClose": "Swipe down to close",
"purchaseFailed": "Something went wrong. Please try again.",
"purchaseFailedNetwork": "Check your connection and try again.",
"alreadySubscribed": "You're already subscribed!",
"trialEndsIn": "Your free trial ends in {days} days",
"trialEndsToday": "Your free trial ends today",
"subscribe": "Subscribe",
"billingIssue": "There's an issue with your payment.",
"updatePayment": "Update in Settings",
"freePlan": "Free Plan",
"upgrade": "Upgrade",
"currentPlan": "Current Plan",
"manageSubscription": "Manage Subscription",
"nextRenewal": "Next renewal: {date}",
"trialEndsDate": "Trial ends: {date}",
"createRecipes": "Create & edit custom recipes",
"aiAnalysis": "AI nutrition analysis per recipe",
"safetyAlerts": "Safety alerts per ingredient",
"personalizedDog": "Personalized for your dog's profile",
"scanLabels": "Scan food labels instantly",
"aiIngredientBreakdown": "AI ingredient safety breakdown",
"subscriptionRequired": "Subscription required"
```

- [ ] **Step 2: Add Turkish keys**

Add the Turkish translations to `messages/tr.json`:

```json
"unlockRecipes": "Tariflerin Kilidini Aç",
"unlockRecipesDesc": "Köpeğiniz için yapay zeka destekli beslenme analizli özel tarifler oluşturun",
"unlockScanner": "Tarayıcının Kilidini Aç",
"unlockScannerDesc": "Anında yapay zeka destekli güvenlik analizi için evcil hayvan mamalarının etiketlerini tarayın",
"freeTrialBadge": "7 günlük ücretsiz deneme",
"monthly": "Aylık",
"annual": "Yıllık",
"savePct": "%{pct} tasarruf",
"basicPlan": "Temel",
"basicPlanDesc": "Yapay zeka tarif analizi",
"premiumPlan": "Premium",
"premiumPlanDesc": "Her şey + etiket tarayıcı",
"mostPopular": "En Popüler",
"bestValue": "En İyi Değer",
"perMonth": "/ay",
"perYear": "/yıl",
"perMonthEquiv": "{price}/ay",
"whatsIncluded": "Neler dahil",
"startFreeTrial": "Ücretsiz Denemeyi Başlat",
"afterTrial": "Denemeden sonra, {price}/{period}. İstediğiniz zaman iptal edin.",
"restorePurchase": "Satın almayı geri yükle",
"swipeToClose": "Kapatmak için aşağı kaydırın",
"purchaseFailed": "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
"purchaseFailedNetwork": "Bağlantınızı kontrol edip tekrar deneyin.",
"alreadySubscribed": "Zaten abonesiniz!",
"trialEndsIn": "Ücretsiz denemeniz {days} gün içinde sona eriyor",
"trialEndsToday": "Ücretsiz denemeniz bugün sona eriyor",
"subscribe": "Abone Ol",
"billingIssue": "Ödemenizle ilgili bir sorun var.",
"updatePayment": "Ayarlardan güncelleyin",
"freePlan": "Ücretsiz Plan",
"upgrade": "Yükselt",
"currentPlan": "Mevcut Plan",
"manageSubscription": "Aboneliği Yönet",
"nextRenewal": "Sonraki yenileme: {date}",
"trialEndsDate": "Deneme bitiş: {date}",
"createRecipes": "Özel tarifler oluşturun ve düzenleyin",
"aiAnalysis": "Tarif başına yapay zeka beslenme analizi",
"safetyAlerts": "İçerik başına güvenlik uyarıları",
"personalizedDog": "Köpeğinizin profiline özel",
"scanLabels": "Gıda etiketlerini anında tarayın",
"aiIngredientBreakdown": "Yapay zeka içerik güvenlik analizi",
"subscriptionRequired": "Abonelik gerekli"
```

- [ ] **Step 3: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/tr.json
git commit -m "feat: add subscription i18n keys (EN + TR)

Paywall sheet, trial banners, subscription card, and
error messages in both English and Turkish."
```

---

### Task 8: Build PaywallSheet Component

**Files:**
- Create: `src/components/subscription/PaywallSheet.tsx`

- [ ] **Step 1: Create PaywallSheet**

Create `src/components/subscription/PaywallSheet.tsx`:

```typescript
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, ScanLine, Check } from "lucide-react";
import { usePurchases } from "@/hooks/use-purchases";
import type { AccessTier } from "@/lib/access";

interface PaywallSheetProps {
  /** Which tier triggered the paywall — determines pre-selection. */
  requiredTier: AccessTier;
  onDismiss: () => void;
}

type PlanKey = "basic" | "premium";
type Period = "monthly" | "annual";

const PRICES: Record<PlanKey, Record<Period, { amount: string; equivalent?: string }>> = {
  basic: {
    monthly: { amount: "$6.99" },
    annual: { amount: "$55.99", equivalent: "$4.67" },
  },
  premium: {
    monthly: { amount: "$9.99" },
    annual: { amount: "$79.99", equivalent: "$6.67" },
  },
};

const RECIPE_FEATURES = [
  "createRecipes",
  "aiAnalysis",
  "safetyAlerts",
  "personalizedDog",
] as const;

const SCANNER_FEATURES = [
  "scanLabels",
  "aiIngredientBreakdown",
  "createRecipes",
  "aiAnalysis",
] as const;

export function PaywallSheet({ requiredTier, onDismiss }: PaywallSheetProps) {
  const t = useTranslations();
  const { purchase, restore } = usePurchases();
  const defaultPlan: PlanKey = requiredTier === "premium" ? "premium" : "basic";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan);
  const [period, setPeriod] = useState<Period>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isRecipeContext = requiredTier !== "premium";
  const features = isRecipeContext ? RECIPE_FEATURES : SCANNER_FEATURES;
  const price = PRICES[selectedPlan][period];
  const periodLabel = period === "monthly" ? t("perMonth") : t("perYear");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  const handlePurchase = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await purchase(selectedPlan, period);
      if (success) onDismiss();
    } catch {
      setError(t("purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [purchase, selectedPlan, period, onDismiss, t]);

  const handleRestore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const restored = await restore();
      if (restored) onDismiss();
      else setError(t("purchaseFailed"));
    } catch {
      setError(t("purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [restore, onDismiss, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onDismiss(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 motion-safe:animate-fade-in" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-md rounded-t-[20px] bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl motion-safe:animate-slide-up md:rounded-[20px] md:mb-0"
        style={{ overscrollBehavior: "contain" }}
        role="dialog"
        aria-modal="true"
        aria-label={isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border md:hidden" />

        {/* Context icon */}
        <div className={`mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px] ${
          isRecipeContext
            ? "bg-gradient-to-br from-primary to-primary-dark"
            : "bg-gradient-to-br from-caution to-[#c49518]"
        }`}>
          {isRecipeContext
            ? <UtensilsCrossed className="h-5 w-5 text-white" />
            : <ScanLine className="h-5 w-5 text-white" />
          }
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-txt">
          {isRecipeContext ? t("unlockRecipes") : t("unlockScanner")}
        </h2>
        <p className="mb-3 text-center text-[13px] text-txt-secondary">
          {isRecipeContext ? t("unlockRecipesDesc") : t("unlockScannerDesc")}
        </p>

        {/* Trial badge */}
        <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-safe/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-primary">{t("freeTrialBadge")}</span>
        </div>

        {/* Period toggle */}
        <div className="mx-auto mb-3 flex w-fit gap-0.5 rounded-[10px] bg-canvas p-0.5">
          <button
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              period === "monthly" ? "bg-surface text-txt shadow-sm" : "text-txt-secondary"
            }`}
            onClick={() => setPeriod("monthly")}
          >
            {t("monthly")}
          </button>
          <button
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              period === "annual" ? "bg-surface text-txt shadow-sm" : "text-txt-secondary"
            }`}
            onClick={() => setPeriod("annual")}
          >
            {t("annual")} <span className="ml-1 rounded bg-caution px-1.5 py-px text-[9px] font-bold text-white">{t("savePct", { pct: "33" })}</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mb-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Choose a plan">
          {(["basic", "premium"] as const).map((plan) => {
            const selected = selectedPlan === plan;
            const p = PRICES[plan][period];
            const tag = plan === "basic" && isRecipeContext ? t("mostPopular")
              : plan === "premium" && !isRecipeContext ? t("bestValue")
              : null;

            return (
              <button
                key={plan}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => !isLoading && setSelectedPlan(plan)}
                className={`relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] p-3.5 transition-all ${
                  selected ? "border-primary bg-primary/5" : "border-border"
                } ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {tag && (
                  <span className={`absolute -top-2 right-3 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase text-white ${
                    plan === "basic" ? "bg-primary" : "bg-caution"
                  }`}>
                    {tag}
                  </span>
                )}
                {/* Radio dot */}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-border"
                }`}>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold text-txt">{t(`${plan}Plan`)}</span>
                  <span className="block text-[11px] text-txt-secondary">{t(`${plan}PlanDesc`)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[17px] font-bold text-txt">{p.amount}</span>
                  <span className="block text-[11px] text-txt-secondary">{period === "monthly" ? t("perMonth") : t("perYear")}</span>
                  {p.equivalent && (
                    <span className="block text-[10px] text-txt-secondary">{t("perMonthEquiv", { price: p.equivalent })}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="mb-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-txt-secondary">{t("whatsIncluded")}</p>
          {features.map((key) => (
            <div key={key} className="flex items-center gap-2 py-1">
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-safe/10">
                <Check className="h-3 w-3 text-primary" />
              </span>
              <span className="text-[13px] text-txt">{t(key)}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={`${t("startFreeTrial")} — ${t(`${selectedPlan}Plan`)}`}
          className="relative mb-2 w-full cursor-pointer rounded-button bg-primary-btn py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
          ) : (
            t("startFreeTrial")
          )}
        </button>

        {/* Error */}
        {error && (
          <p role="alert" className="mb-2 text-center text-xs text-toxic">{error}</p>
        )}

        {/* Fine print */}
        <p className="text-center text-[11px] text-txt-tertiary">
          {t("afterTrial", { price: price.amount, period: period === "monthly" ? t("monthly").toLowerCase() : t("annual").toLowerCase() })}
        </p>
        <button
          onClick={handleRestore}
          disabled={isLoading}
          className="mt-1.5 block w-full cursor-pointer text-center text-xs font-medium text-txt-secondary"
        >
          {t("restorePurchase")}
        </button>
        <p className="mt-1 text-center text-[10px] text-txt-tertiary md:hidden">{t("swipeToClose")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add slide-up animation to globals.css**

Add these keyframes to `src/app/globals.css` (inside the existing `@theme` or after it):

```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

And add the utility classes:

```css
.animate-slide-up {
  animation: slide-up 250ms ease-out;
}
.animate-fade-in {
  animation: fade-in 200ms ease-out;
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/subscription/PaywallSheet.tsx src/app/globals.css
git commit -m "feat: add PaywallSheet component

Comparison bottom sheet with plan cards, period toggle,
trial badge, contextual features, and purchase flow.
Accessible with ARIA roles and keyboard support."
```

---

### Task 9: Build SubscriptionBanner Component

**Files:**
- Create: `src/components/subscription/SubscriptionBanner.tsx`

- [ ] **Step 1: Create SubscriptionBanner**

Create `src/components/subscription/SubscriptionBanner.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface SubscriptionBannerProps {
  onSubscribeClick: () => void;
  onManageClick: () => void;
}

export function SubscriptionBanner({ onSubscribeClick, onManageClick }: SubscriptionBannerProps) {
  const t = useTranslations();
  const { isTrialing, subscriptionExpiry, hasBillingIssue } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Billing issue banner
  if (hasBillingIssue) {
    return (
      <div className="flex items-center gap-2 rounded-card bg-toxic/10 px-4 py-2.5">
        <p className="flex-1 text-xs font-medium text-toxic">
          {t("billingIssue")}{" "}
          <button onClick={onManageClick} className="cursor-pointer font-semibold underline">
            {t("updatePayment")}
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-toxic/60"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Trial expiry banner
  if (!isTrialing || !subscriptionExpiry) return null;

  const expiryDate = new Date(subscriptionExpiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 3) return null;

  const message = daysLeft <= 0
    ? t("trialEndsToday")
    : t("trialEndsIn", { days: String(daysLeft) });

  return (
    <div className="flex items-center gap-2 rounded-card bg-[#FFF8E1] px-4 py-2.5">
      <p className="flex-1 text-xs font-medium text-caution">
        {message}{" "}
        <button onClick={onSubscribeClick} className="cursor-pointer font-semibold underline">
          {t("subscribe")}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-caution/60"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/subscription/SubscriptionBanner.tsx
git commit -m "feat: add SubscriptionBanner for trial expiry and billing issues

Shows amber banner when trial ends within 3 days.
Shows red banner on billing issues with manage link."
```

---

### Task 10: Build SubscriptionCard for Profile

**Files:**
- Create: `src/components/subscription/SubscriptionCard.tsx`

- [ ] **Step 1: Create SubscriptionCard**

Create `src/components/subscription/SubscriptionCard.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Crown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { usePurchases } from "@/hooks/use-purchases";

interface SubscriptionCardProps {
  onUpgradeClick: () => void;
}

export function SubscriptionCard({ onUpgradeClick }: SubscriptionCardProps) {
  const t = useTranslations();
  const { subscriptionTier, subscriptionExpiry, isTrialing } = useAuthStore();
  const { manageSubscription, restore } = usePurchases();

  const isFree = subscriptionTier === "FREE";
  const tierLabel = subscriptionTier === "PREMIUM"
    ? t("premiumPlan")
    : subscriptionTier === "BASIC"
    ? t("basicPlan")
    : t("freePlan");

  if (isFree) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className="w-full cursor-pointer text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80"
      >
        <Card className="flex items-center gap-3 p-4">
          <Crown className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
          <span className="flex-1 font-medium text-txt">{t("upgrade")}</span>
          <Badge variant="premium">PRO</Badge>
          <ChevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </button>
    );
  }

  const expiryDate = subscriptionExpiry
    ? new Date(subscriptionExpiry).toLocaleDateString()
    : null;

  return (
    <div className="flex flex-col gap-2">
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-txt">{tierLabel}</span>
          </div>
          <Badge>{t("currentPlan")}</Badge>
        </div>
        {isTrialing && expiryDate && (
          <p className="mb-1 text-xs text-caution">{t("trialEndsDate", { date: expiryDate })}</p>
        )}
        {!isTrialing && expiryDate && (
          <p className="text-xs text-txt-secondary">{t("nextRenewal", { date: expiryDate })}</p>
        )}
      </Card>
      <button
        onClick={manageSubscription}
        className="w-full cursor-pointer text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80"
      >
        <Card className="flex items-center gap-3 p-4">
          <span className="flex-1 text-sm font-medium text-txt">{t("manageSubscription")}</span>
          <ChevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </button>
      <button
        onClick={restore}
        className="cursor-pointer text-center text-xs font-medium text-txt-secondary"
      >
        {t("restorePurchase")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/components/subscription/SubscriptionCard.tsx
git commit -m "feat: add SubscriptionCard for profile page

Shows current plan, renewal date, trial status.
Free users see upgrade CTA. Subscribers see manage link."
```

---

### Task 11: Wire Up App Layout — Banner + Remove Hardcoded Paywall

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Update layout to use SubscriptionBanner and pass-through soft-gated routes**

Replace `src/app/(app)/layout.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { LoginSheet } from "@/components/auth/LoginSheet";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { resolveUserTier, getRequiredTier, getAccessGateReason } from "@/lib/access";
import { shouldRequireTerms } from "@/lib/terms";
import { usePurchases } from "@/hooks/use-purchases";
import type { AccessTier } from "@/lib/access";

const ONBOARDING_KEY = "onboarding_completed";
const GUEST_PET_KEY = "guest_pet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const { session, subscriptionTier, isLoading: authLoading } = useAuthStore();
  const { pets, isLoading: petsLoading, fetchPets, loadGuestPet, syncGuestPet } = usePets();
  const { manageSubscription } = usePurchases();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [paywallTier, setPaywallTier] = useState<AccessTier | null>(null);

  // Fetch pets when authenticated, load guest pet otherwise
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      fetchPets();
      syncGuestPet();
    } else {
      loadGuestPet();
    }
  }, [authLoading, session, fetchPets, loadGuestPet, syncGuestPet]);

  // Redirect to terms acceptance if needed
  useEffect(() => {
    if (authLoading) return;
    if (shouldRequireTerms(!!session, session?.user?.user_metadata)) {
      router.replace("/terms");
    }
  }, [authLoading, session, router]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (authLoading || petsLoading) return;
    if (shouldRequireTerms(!!session, session?.user?.user_metadata)) return;

    const onboardingDone =
      typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "true";
    const hasGuestPet =
      typeof window !== "undefined" && localStorage.getItem(GUEST_PET_KEY) !== null;

    if (!onboardingDone && !hasGuestPet) {
      if (!session || (session && pets.length === 0)) {
        router.replace("/welcome");
      }
    }
  }, [authLoading, petsLoading, session, pets.length, router]);

  // Determine access gate for current route
  const userTier = resolveUserTier(session, subscriptionTier);
  const requiredTier = getRequiredTier(pathname);
  const gateReason = getAccessGateReason(session, userTier, requiredTier);

  // Show/hide login sheet based on gate reason
  useEffect(() => {
    setShowLoginSheet(gateReason === "login");
  }, [gateReason, pathname]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md md:max-w-lg lg:max-w-2xl bg-canvas pb-20">
      <SubscriptionBanner
        onSubscribeClick={() => setPaywallTier("basic")}
        onManageClick={manageSubscription}
      />
      {gateReason === "none" && children}
      {gateReason === "paywall" && children}
      {showLoginSheet && (
        <LoginSheet onDismiss={() => router.replace("/search")} />
      )}
      {paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={() => setPaywallTier(null)} />
      )}
      <BottomNav />
    </div>
  );
}
```

Key changes: both `"none"` and `"paywall"` render `children` (soft gate). The old hardcoded "Coming Soon" paywall is removed.

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/layout.tsx
git commit -m "feat: wire SubscriptionBanner into app layout, remove hardcoded paywall

Soft-gated routes now render children. PaywallSheet triggered
by action gates, not route gates. Banner shows trial/billing."
```

---

### Task 12: Gate Recipe Actions

**Files:**
- Modify: `src/app/(app)/recipes/page.tsx`
- Modify: `src/app/(app)/recipes/new/page.tsx`
- Modify: `src/app/(app)/recipes/analysis/page.tsx`

- [ ] **Step 1: Gate "New Recipe" button on recipes list page**

In `src/app/(app)/recipes/page.tsx`, add the entitlement hook and PaywallSheet. Import at top:

```typescript
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
```

Inside the component, add after the existing hooks:

```typescript
const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

const handleNewRecipe = () => {
  if (!guardAction("recipes.create")) return;
  router.push("/recipes/new");
};
```

Replace both `onClick={() => router.push("/recipes/new")}` occurrences with `onClick={handleNewRecipe}`.

Add before `</div>` at the end of the return:

```typescript
{isPaywallOpen && paywallTier && (
  <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
)}
```

- [ ] **Step 2: Gate form submission on new recipe page**

In `src/app/(app)/recipes/new/page.tsx`, add imports:

```typescript
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
```

Add hook and guard the submit:

```typescript
const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

const handleSubmit = async (values: RecipeFormValues) => {
  if (!guardAction("recipes.create")) return;
  setIsSubmitting(true);
  try {
    const recipe = await createRecipe(values);
    router.replace(`/recipes/edit?id=${recipe.id}`);
  } finally {
    setIsSubmitting(false);
  }
};
```

Add PaywallSheet before the closing `</div>`:

```typescript
{isPaywallOpen && paywallTier && (
  <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
)}
```

- [ ] **Step 3: Gate analysis on analysis page**

In `src/app/(app)/recipes/analysis/page.tsx`, add imports:

```typescript
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
```

Add hook and guard auto-analyze (modify the useEffect that triggers analysis):

```typescript
const { guardAction, canPerform, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

// Auto-start analysis on mount (only if user has entitlement)
useEffect(() => {
  if (recipeId && recipe && status === "idle" && (forceReanalyze || !storedAnalysis?.result)) {
    if (canPerform("recipes.analyze")) {
      analyze(recipeId, recipe.pet_id, locale);
    }
  }
}, [recipeId, recipe, status, storedAnalysis, forceReanalyze, analyze, locale, canPerform]);
```

Guard handleRetry:

```typescript
const handleRetry = () => {
  if (!guardAction("recipes.analyze")) return;
  if (recipeId && recipe) {
    analyze(recipeId, recipe.pet_id, locale);
  }
};
```

Add PaywallSheet before closing `</div>`.

- [ ] **Step 4: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/recipes/page.tsx src/app/(app)/recipes/new/page.tsx src/app/(app)/recipes/analysis/page.tsx
git commit -m "feat: gate recipe actions behind Basic subscription

New Recipe button, form submission, and AI analysis all
check useEntitlement before proceeding. Shows PaywallSheet
when user lacks Basic tier."
```

---

### Task 13: Gate Scanner Action

**Files:**
- Modify: `src/app/(app)/scan/page.tsx`

- [ ] **Step 1: Replace hardcoded CTA with entitlement-gated button**

Replace `src/app/(app)/scan/page.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";
import { useEntitlement } from "@/hooks/use-entitlement";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";

const STEPS = ["scanStep1", "scanStep2", "scanStep3"] as const;

export default function ScanPage() {
  const t = useTranslations();
  const { guardAction, isPaywallOpen, paywallTier, dismissPaywall } = useEntitlement();

  const handleStartScan = () => {
    if (!guardAction("scanner.scan")) return;
    // TODO: actual scan functionality (future feature)
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
      <h1 className="mb-6 text-center text-lg font-bold text-txt">{t("scannerTitle")}</h1>

      {/* Scan preview card */}
      <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface p-6">
        {/* Viewfinder */}
        <div className="relative mb-4 rounded-xl bg-surface-variant p-8">
          <div className="absolute left-2 top-2 h-5 w-5 rounded-tl border-l-[3px] border-t-[3px] border-primary" />
          <div className="absolute right-2 top-2 h-5 w-5 rounded-tr border-r-[3px] border-t-[3px] border-primary" />
          <div className="absolute bottom-2 left-2 h-5 w-5 rounded-bl border-b-[3px] border-l-[3px] border-primary" />
          <div className="absolute bottom-2 right-2 h-5 w-5 rounded-br border-b-[3px] border-r-[3px] border-primary" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-1.5 w-[80%] rounded-full bg-border" />
            <div className="h-1.5 w-[60%] rounded-full bg-border" />
            <div className="h-1.5 w-[90%] rounded-full bg-border" />
            <div className="h-1.5 w-[50%] rounded-full bg-border" />
            <div className="h-1.5 w-[75%] rounded-full bg-border" />
          </div>
        </div>
        <h2 className="text-center text-base font-semibold text-txt">{t("scanFoodLabels")}</h2>
        <p className="mt-1 text-center text-sm text-txt-secondary">{t("scanDescription")}</p>
      </div>

      {/* How it works */}
      <div className="mb-4 rounded-card border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-txt">{t("howItWorks")}</h3>
        <div className="flex flex-col gap-3">
          {STEPS.map((stepKey, i) => (
            <div key={stepKey} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-txt">{t(stepKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary-dark p-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Icons.layers className="h-4 w-4 text-white" aria-hidden="true" />
          <span className="font-bold text-white">{t("unlockScanner")}</span>
        </div>
        <p className="mb-4 text-xs text-white/75">{t("includedWithPremium")}</p>
        <button
          onClick={handleStartScan}
          className="w-full cursor-pointer rounded-button bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all duration-150 ease-out active:scale-95 active:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          {t("upgradeToPremium")}
        </button>
      </div>

      {isPaywallOpen && paywallTier && (
        <PaywallSheet requiredTier={paywallTier} onDismiss={dismissPaywall} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/scan/page.tsx
git commit -m "feat: gate scanner behind Premium subscription

Start Scan button triggers guardAction('scanner.scan').
Shows PaywallSheet with Premium pre-selected when tapped."
```

---

### Task 14: Update Profile Page with SubscriptionCard

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`

- [ ] **Step 1: Replace placeholder subscription link with SubscriptionCard**

In `src/app/(app)/profile/page.tsx`, add imports:

```typescript
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
```

Add state and hook inside the component (authenticated section):

```typescript
const [showPaywall, setShowPaywall] = useState(false);
```

Replace the `{/* Subscription */}` section (lines 132-143) with:

```typescript
{/* Subscription */}
<div>
  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("subscription")}</p>
  <SubscriptionCard onUpgradeClick={() => setShowPaywall(true)} />
</div>
```

Add PaywallSheet before the closing `</div>` of the authenticated return:

```typescript
{showPaywall && (
  <PaywallSheet requiredTier="basic" onDismiss={() => setShowPaywall(false)} />
)}
```

Also update the Badge display (line 105-107) to handle BASIC:

```typescript
<Badge>
  {subscriptionTier === "PREMIUM" ? t("premiumPlan") : subscriptionTier === "BASIC" ? t("basicPlan") : t("freePlan")}
</Badge>
```

- [ ] **Step 2: Verify build**

```bash
npm run build:static 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/profile/page.tsx
git commit -m "feat: replace profile subscription placeholder with SubscriptionCard

Shows current plan status, manage subscription link,
and upgrade CTA for free users."
```

---

### Task 15: Server-Side Subscription Check on Analyze Endpoint

**Files:**
- Modify: `src/app/api/recipes/analyze/route.ts`

- [ ] **Step 1: Add subscription tier check after auth validation**

In `src/app/api/recipes/analyze/route.ts`, after the auth header check and before the recipe query (after line 34), add:

```typescript
  // 2b. Check subscription tier
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user?.user_metadata?.subscription_tier ?? "FREE";
  if (tier !== "BASIC" && tier !== "PREMIUM") {
    return Response.json(
      { error: "subscription_required", required: "basic" },
      { status: 403, headers: corsHeaders },
    );
  }
```

- [ ] **Step 2: Verify build**

```bash
BUILD_MODE=server npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/recipes/analyze/route.ts
git commit -m "feat: add server-side subscription check on analyze endpoint

Returns 403 with subscription_required error when user
lacks BASIC or PREMIUM tier. Defense in depth — client
gates are UX only."
```

---

### Task 16: RevenueCat Webhook Endpoint

**Files:**
- Create: `src/app/api/webhooks/revenuecat/route.ts`

- [ ] **Step 1: Create webhook handler**

Create `src/app/api/webhooks/revenuecat/route.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Map RevenueCat entitlement IDs to our subscription tier. */
function mapTier(entitlements: string[]): SubscriptionTier {
  if (entitlements.includes("premium")) return "PREMIUM";
  if (entitlements.includes("basic")) return "BASIC";
  return "FREE";
}

export async function POST(request: Request) {
  // 1. Validate webhook signature
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Invalid signature" }, { status: 401, headers: corsHeaders });
    }
  }

  // 2. Parse event
  const body = await request.json();
  const event = body.event;
  if (!event) {
    return Response.json({ error: "No event" }, { status: 400, headers: corsHeaders });
  }

  const eventType: string = event.type;
  const appUserId: string | undefined = event.app_user_id;

  if (!appUserId) {
    return Response.json({ ok: true }, { headers: corsHeaders });
  }

  // 3. Determine new tier from entitlements
  const activeEntitlements: string[] = Object.keys(event.subscriber?.entitlements ?? {})
    .filter((key) => {
      const ent = event.subscriber.entitlements[key];
      return ent.expires_date === null || new Date(ent.expires_date) > new Date();
    });

  const tier = mapTier(activeEntitlements);

  // 4. Determine expiry (use latest expiry across active entitlements)
  let latestExpiry: string | null = null;
  for (const key of activeEntitlements) {
    const ent = event.subscriber.entitlements[key];
    if (ent.expires_date && (!latestExpiry || ent.expires_date > latestExpiry)) {
      latestExpiry = ent.expires_date;
    }
  }

  // 5. Determine product ID
  const productId: string | null = event.product_id ?? null;

  // 6. Check for billing issue
  const isBillingIssue = eventType === "BILLING_ISSUE";

  // 7. Update Supabase user_metadata via service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.updateUserById(appUserId, {
    user_metadata: {
      subscription_tier: tier,
      subscription_expiry: latestExpiry,
      subscription_product: productId,
      has_billing_issue: isBillingIssue ? true : undefined,
    },
  });

  if (error) {
    console.error("Failed to update user metadata:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ ok: true, tier }, { headers: corsHeaders });
}
```

- [ ] **Step 2: Verify build**

```bash
BUILD_MODE=server npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/revenuecat/route.ts
git commit -m "feat: add RevenueCat webhook endpoint

Handles all subscription events (purchase, renewal, cancellation,
expiration, billing issue). Maps entitlements to tier and updates
Supabase user_metadata via admin client."
```

---

### Task 17: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Build static export**

```bash
npm run build:static
```

Expected: Clean build, no type errors.

- [ ] **Step 2: Build server mode**

```bash
BUILD_MODE=server npm run build
```

Expected: Clean build including API routes.

- [ ] **Step 3: Sync Capacitor**

```bash
npx cap sync ios
```

- [ ] **Step 4: Verify file structure**

```bash
find src -name "*.ts" -o -name "*.tsx" | grep -E "(entitlement|purchase|subscription|paywall|webhook)" | sort
```

Expected output:
```
src/app/api/webhooks/revenuecat/route.ts
src/components/subscription/PaywallSheet.tsx
src/components/subscription/SubscriptionBanner.tsx
src/components/subscription/SubscriptionCard.tsx
src/hooks/use-entitlement.ts
src/hooks/use-purchases.ts
src/lib/entitlements.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final verification — all builds pass

Static export and server builds both clean.
Capacitor iOS synced with RevenueCat plugin."
```
