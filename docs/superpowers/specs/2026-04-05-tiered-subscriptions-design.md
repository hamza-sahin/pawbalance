# Tiered Subscriptions Design

## Overview

End-to-end implementation of a tiered subscription system for PawBalance, covering App Store Connect product configuration, RevenueCat integration (iOS + Web), paywall UI, access control, and subscription lifecycle management.

## Tier Model

| Tier | Enum Value | Access Level | Features | Price |
|------|-----------|-------------|----------|-------|
| Guest | (no session) | 0 | Search, Learn | Free |
| Free | `FREE` | 1 | + Profile, Pets | Free |
| Basic | `BASIC` | 2 | + Recipes (create, edit, analyze) | $6.99/mo, $49.99/yr |
| Premium | `PREMIUM` | 3 | + Scanner | $9.99/mo, $79.99/yr |

All paid tiers include a 7-day free trial. One trial per subscription group (Apple restriction). Annual plans save ~33%.

## App Store Connect Products

**All products created programmatically via App Store Connect MCP tools during implementation.**

App Store Connect app ID: `6761324827` (Paw Balance, bundle `com.pawbalance.app`)

Subscription group: **"PawBalance Pro"**

| Product ID | Type | Price | Trial |
|-----------|------|-------|-------|
| `com.pawbalance.basic.monthly` | Auto-renewable | $6.99 | 7 days |
| `com.pawbalance.basic.annual` | Auto-renewable | $49.99 | 7 days |
| `com.pawbalance.premium.monthly` | Auto-renewable | $9.99 | 7 days |
| `com.pawbalance.premium.annual` | Auto-renewable | $79.99 | 7 days |

Localized display names and descriptions in EN + TR.

## RevenueCat Configuration

**All RevenueCat setup done programmatically via RevenueCat MCP tools during implementation.**

RevenueCat project ID: `projc65eb1f1` (Paw Balance)

Steps (all via MCP):
1. Create Apple App Store app in RevenueCat (link to App Store Connect)
2. Create 4 products mirroring App Store Connect
3. Create entitlements (`basic`, `premium`)
4. Attach products to entitlements
5. Create "default" offering with Basic and Premium packages
6. Attach products to packages
7. Configure webhook

**Entitlements:**

| Entitlement ID | Grants Access To | Mapped Products |
|---------------|-----------------|----------------|
| `basic` | Recipes (create, edit, analyze) | All Basic + All Premium products |
| `premium` | Scanner + everything in Basic | All Premium products |

Premium products grant both entitlements — a Premium user automatically gets Basic access.

**Offering:** "default" with two packages (Basic, Premium), each containing monthly + annual products.

**Platforms:**
- Apple App Store app with shared secret (iOS via StoreKit)
- Stripe app via RC Billing (web)

**Webhook:** `https://pawbalance.optalgo.com/api/webhooks/revenuecat`

## Access Control Architecture

### Two-Layer System

**Layer 1 — Route Gate (existing, modified)**

Routes are relaxed to allow soft-gate browsing:

```
ROUTE_ACCESS:
  /search   -> guest
  /learn    -> guest
  /profile  -> free    (requires login)
  /recipes  -> guest   (anyone can browse — soft gate)
  /scan     -> guest   (anyone can browse — soft gate)
```

The route gate only shows the LoginSheet for unauthenticated users hitting `/profile`.

**Layer 2 — Action Gate (new)**

Paywall triggers on specific actions, not navigation. A `useEntitlement()` hook provides:

```typescript
const { canPerform, guardAction } = useEntitlement();

// guardAction checks entitlement and shows paywall if needed.
// Returns true if action is allowed, false if paywall was shown.
// The paywall auto-selects the tier required by the action.
if (!guardAction("recipes.create")) return;
// proceed with action...
```

**Entitlements Map (single source of truth):**

```typescript
const ACTION_ENTITLEMENTS: Record<string, AccessTier> = {
  "recipes.read":    "free",
  "recipes.create":  "basic",
  "recipes.edit":    "basic",
  "recipes.analyze": "basic",
  "scanner.scan":    "premium",
};
```

**Gated actions by page:**

| Page | Visible To | Gated Actions |
|------|-----------|---------------|
| `/recipes` | Everyone | "New Recipe" button -> `basic` |
| `/recipes/new` | Everyone | Form submission -> `basic` |
| `/recipes/edit` | Everyone | Save/edit -> `basic` |
| `/recipes/analysis` | Everyone | "Run Analysis" -> `basic` |
| `/scan` | Everyone | "Start Scan" -> `premium` |

**Server-side enforcement:**

Protected API routes (`POST /api/recipes/analyze`) check entitlements via RevenueCat REST API or Supabase `subscription_tier` before processing. Returns `403 { error: "subscription_required", required: "basic" }`.

## Subscription State & Sync

### Data Flow

```
Purchase (iOS/Web)
    ↓
RevenueCat SDK confirms
    ↓
Client: optimistic update
  → RevenueCat SDK entitlements cache
  → Zustand store updated immediately
  → PaywallSheet dismisses
    ↓ (async, seconds later)
Server: webhook confirmation
  → POST /api/webhooks/revenuecat
  → Validate webhook signature
  → Update Supabase user_metadata:
      subscription_tier: "BASIC" | "PREMIUM"
      subscription_expiry: ISO date
      subscription_product: product ID
```

### Zustand Auth Store Changes

Existing `subscriptionTier` field stays. Source changes from Supabase-only to RevenueCat SDK primary, Supabase fallback.

New fields:
- `subscriptionExpiry: string | null`
- `isTrialing: boolean`

### Re-validation Triggers

1. App foreground (Capacitor `appStateChange` listener)
2. Web: every 15 minutes via `setInterval`
3. After any purchase/restore flow
4. On auth state change (login/logout)

### Schema Change

`SubscriptionTier` enum expands from `["FREE", "PREMIUM"]` to `["FREE", "BASIC", "PREMIUM"]`.

No new database tables. RevenueCat is the subscription database; Supabase mirrors the tier for server-side access checks.

**All Supabase schema changes (migrations, RPC functions, RLS policies) are applied via Supabase MCP tools during implementation.**

## Paywall Sheet UI

### Design: Option A — Compact Cards with Feature List

A bottom sheet that slides up when a gated action is tapped. Always shows both tiers with the relevant one pre-selected.

**Layout (top to bottom):**
1. Sheet handle (swipe-down affordance)
2. Context icon (recipe/scanner gradient icon)
3. Title: "Unlock Recipes" / "Unlock Scanner"
4. Subtitle: feature-specific description
5. Trial badge: "7-day free trial"
6. Period toggle: Monthly | Annual (with "Save 33%" pill)
7. Plan cards (radio-style): Basic and Premium with price, description, contextual tag
8. Feature checklist: 4 items relevant to the triggered context
9. CTA: "Start Free Trial" (full-width primary button)
10. Fine print: "After trial, $X/month. Cancel anytime."
11. Restore purchase link
12. "Swipe down to close" hint

**Contextual behavior:**
- Triggered from Recipes: Basic pre-selected, "Most Popular" tag
- Triggered from Scanner: Premium pre-selected, "Best Value" tag
- Annual view shows monthly equivalent (e.g. "$4.67/month")

**States:**
- Default: plan selection with CTA
- Loading: CTA shows spinner, cards dimmed, interactions disabled
- Success: sheet dismisses, feature unlocked

**Accessibility:**
- `role="radiogroup"` / `role="radio"` with `aria-checked` on plan cards
- Arrow key navigation between plan cards (up/down to switch selection)
- `aria-label` on CTA button describing the selected plan
- `aria-busy="true"` during purchase loading
- Focus-visible outlines on all interactive elements
- `prefers-reduced-motion` disables animations

**UX details:**
- `overscroll-behavior: contain` on sheet overlay (prevents pull-to-refresh conflict)
- Sheet dismisses on swipe-down, back gesture, and overlay tap
- Min 44px touch targets on all interactive elements
- `cursor-pointer` on plan cards, period toggle buttons, CTA, and restore link
- 10px gap between plan cards (exceeds 8px minimum)

**Sheet animation:**
- Slide-up: `transform: translateY(100%) -> translateY(0)`, 250ms `ease-out`
- Slide-down (dismiss): 200ms `ease-in`
- Overlay fade: 200ms `ease-out`
- `prefers-reduced-motion`: instant show/hide, no slide

**Responsive behavior:**
- Mobile (< 768px): full-width bottom sheet
- Tablet/Desktop (>= 768px): centered modal with `max-width: 480px`, rounded corners all sides
- z-index: 50 (above BottomNav at 40, below system toasts at 60)

**Error states:**
- Purchase failed (StoreKit error / card declined): CTA returns to default state, inline error message below CTA: "Something went wrong. Please try again." with `role="alert"`
- Network timeout: same error message with "Check your connection and try again."
- Already subscribed (edge case): dismiss sheet, show toast "You're already subscribed!"

### Mockups

Mockups saved at `.superpowers/brainstorm/22952-1775373615/content/paywall-sheet-v2.html`

## Webhook Endpoint

### `POST /api/webhooks/revenuecat`

1. Validate webhook signature using `REVENUECAT_WEBHOOK_SECRET`
2. Extract event type and subscriber info
3. Map entitlements to tier: has `premium` -> `PREMIUM`, has `basic` only -> `BASIC`, neither -> `FREE`
4. Update Supabase `user_metadata` via admin client

**Events handled:**

| RevenueCat Event | Action |
|-----------------|--------|
| `INITIAL_PURCHASE` | Set tier to BASIC or PREMIUM |
| `RENEWAL` | Update expiry date |
| `PRODUCT_CHANGE` | Upgrade/downgrade tier |
| `CANCELLATION` | Keep tier active until expiry, mark as canceling |
| `EXPIRATION` | Set tier back to FREE |
| `BILLING_ISSUE` | Flag for billing issue banner |
| `SUBSCRIBER_ALIAS` | Link anonymous to identified user |

**Environment variables:**
- `REVENUECAT_WEBHOOK_SECRET` — webhook signature validation
- `REVENUECAT_API_KEY` — server-side REST API calls

## Profile Subscription Management

**Free users:**
- Card showing "Free Plan" with "Upgrade" button opening PaywallSheet (no pre-selection)

**Subscribed users (Basic/Premium):**
- Card showing: current tier, billing period, next renewal date, trial status
- "Manage Subscription" — iOS: native `StoreKit.showManageSubscriptions()`, web: RevenueCat Stripe customer portal
- "Restore Purchases" link

**Trialing users:**
- Same as subscribed with banner: "Trial ends April 12 — 5 days left"

No custom cancellation flow. Apple and Stripe handle cancellation through their own UIs.

## Trial & Billing Banners

### Trial Expiry Banner

- Shows when `isTrialing === true` AND `subscriptionExpiry` within 3 days
- Displayed on all `(app)` pages, above content
- Content: "Your free trial ends in X days" with "Subscribe" link
- < 24 hours: "Your free trial ends today"
- Warm amber background (`#FFF8E1`)
- Dismissible per session (localStorage), reappears next session

### Billing Issue Banner

- Shows when RevenueCat reports a billing issue
- Content: "There's an issue with your payment. Update in Settings."
- Links to native subscription management / Stripe portal
- Red-tinted background using safety red

Both implemented as a single `SubscriptionBanner` component in the `(app)` layout reading from Zustand.

## Edge Cases

### Purchase & Sync
1. **Webhook delayed** — Client optimistically updates from RevenueCat SDK entitlements. Webhook catches up for server truth.
2. **Cross-platform sync** — Web app load checks RevenueCat REST API for current entitlements, not just Supabase metadata.
3. **Offline** — RevenueCat SDK caches entitlements locally. Last-known state persists.
4. **Restore purchases** — "Restore Purchases" button on paywall and in Profile. Uses `restorePurchases()` SDK method.

### Subscription Lifecycle
5. **Subscription expired mid-session** — Don't kick user out. Re-check on next navigation or action. Show gentle expiry sheet.
6. **Downgrade Premium -> Basic** — Read-only access to past scanner data. New scans gated.
7. **Refund** — RevenueCat `CANCELLATION` webhook sets tier to `FREE`.
8. **Billing grace period** — Apple gives up to 16 days. RevenueCat keeps entitlement active. We show billing issue banner.
9. **Family Sharing** — Supported natively by RevenueCat. Enabled in App Store Connect subscription settings.

### State Management
10. **Stale tier in Zustand** — Re-check on app foreground + periodic web checks (15 min).
11. **Guest -> Free -> Basic in one session** — Each transition reactively updates Zustand. PaywallSheet auto-dismisses on tier change.
12. **Race condition during SSE streaming** — Check entitlements at stream initiation only. Once started, let it finish.
13. **Action-level data visibility** — Downgraded users retain read-only access to their own data. Only new actions are gated.

### Server Security
14. **API enforcement** — Server middleware checks subscription tier before processing protected endpoints. Returns 403 with structured error.
15. **Client-side gating is UX only** — All business-critical checks happen server-side.

## New Dependencies

- `@revenuecat/purchases-capacitor` — RevenueCat Capacitor plugin (iOS StoreKit)
- RevenueCat Web SDK (RC Billing) — for Stripe-backed web purchases

## New Environment Variables

- `REVENUECAT_WEBHOOK_SECRET`
- `REVENUECAT_API_KEY`
- `REVENUECAT_APPLE_API_KEY` (public, for iOS SDK init)
- `REVENUECAT_WEB_API_KEY` (public, for web SDK init)

## Files Changed / Created

### New Files
- `src/lib/entitlements.ts` — ACTION_ENTITLEMENTS map, `canPerform()`, `getRequiredEntitlement()`
- `src/hooks/use-entitlement.ts` — `useEntitlement()` hook with `canPerform()` and `guardAction()`
- `src/hooks/use-purchases.ts` — RevenueCat SDK wrapper (init, purchase, restore, entitlements)
- `src/components/subscription/PaywallSheet.tsx` — Paywall bottom sheet component
- `src/components/subscription/SubscriptionBanner.tsx` — Trial/billing banner
- `src/components/subscription/SubscriptionCard.tsx` — Profile subscription management card
- `src/app/api/webhooks/revenuecat/route.ts` — Webhook handler

### Modified Files
- `src/lib/types.ts` — Add `BASIC` to `SubscriptionTier` enum
- `src/lib/access.ts` — Update `ROUTE_ACCESS` (recipes/scan -> guest), update `resolveUserTier()` to handle BASIC
- `src/store/auth-store.ts` — Add `subscriptionExpiry`, `isTrialing` fields; sync from RevenueCat SDK
- `src/app/(app)/layout.tsx` — Add `SubscriptionBanner`, remove paywall from route gate
- `src/app/(app)/recipes/page.tsx` — Gate "New Recipe" button with `useEntitlement()`
- `src/app/(app)/recipes/new/page.tsx` — Gate form submission
- `src/app/(app)/recipes/analysis/page.tsx` — Gate "Run Analysis"
- `src/app/(app)/scan/page.tsx` — Gate "Start Scan" with `useEntitlement()`
- `src/app/(app)/profile/page.tsx` — Add SubscriptionCard section
- `capacitor.config.ts` — Add RevenueCat plugin config (if needed)
- `package.json` — Add RevenueCat dependencies
- `messages/en.json` + `messages/tr.json` — Add subscription-related i18n keys
