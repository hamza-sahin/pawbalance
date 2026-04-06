# Web Billing via RevenueCat RC Billing + Stripe

**Date:** 2026-04-07
**Status:** Approved
**Scope:** Add web subscription purchases using RevenueCat RC Billing (Stripe) alongside existing iOS in-app purchases.

## Context

PawBalance has a fully working iOS billing flow via RevenueCat + StoreKit. Web users at `pawbalance.optalgo.com` currently cannot purchase subscriptions — `usePurchases().purchase()` returns `false` on web. This spec adds web billing so both platforms share a single RevenueCat dashboard for subscription management.

## Architecture

```
iOS App                          Web App (pawbalance.optalgo.com)
  │                                │
  ├─ RevenueCat Capacitor SDK      ├─ RevenueCat Web SDK (@revenuecat/purchases-js)
  │   └─ StoreKit (Apple)          │   └─ Stripe (in-page modal via RC Billing)
  │                                │
  └──────────┬─────────────────────┘
             │
     RevenueCat Dashboard
     (single source of truth)
             │
             ├─► Webhook → POST /api/webhooks/revenuecat → Supabase user_metadata
             │
             └─► REST API → POST /api/auth/sync-entitlements (login fallback)
```

RevenueCat is the single source of truth. Supabase `user_metadata` is a cache updated by:
1. Webhook (primary, real-time)
2. Client-side sync after purchase (immediate)
3. Server-side REST API check on login (fallback for missed webhooks)

## External Integration Status (Verified 2026-04-07)

### RevenueCat Apps
| App | Type | ID | Status |
|-----|------|----|--------|
| Test Store | test_store | `app8c934ec48f` | Active |
| PawBalance iOS | app_store | `app9d57e12814` | Active, ASC API key + shared secret configured |
| Paw Balance (Stripe) | stripe | `appe0a5188c47` | Active, connected to `acct_1TJKGDKH75fSihtH` |

### Stripe Products & Prices (Paw Balance account)
| Product | Stripe ID | Price | Interval | Trial | Lookup Key |
|---------|-----------|-------|----------|-------|------------|
| Basic | `prod_UHu8rUqYfEGDt7` | $6.99 | month | 7 days | `pawbalance_basic_monthly` |
| Basic | `prod_UHu8rUqYfEGDt7` | $49.99 | year | 7 days | `pawbalance_basic_annual` |
| Premium | `prod_UHu8PDP5LquhfT` | $9.99 | month | 7 days | `pawbalance_premium_monthly` |
| Premium | `prod_UHu8PDP5LquhfT` | $79.99 | year | 7 days | `pawbalance_premium_annual` |

### RevenueCat Entitlements → Products
| Entitlement | iOS Products | Stripe Products |
|-------------|-------------|-----------------|
| `basic` | basic monthly, basic annual, premium monthly, premium annual | Basic (Stripe), Premium (Stripe) |
| `premium` | premium monthly, premium annual | Premium (Stripe) |

### RevenueCat Offerings (Default)
| Package | Lookup Key | iOS Product | Stripe Product |
|---------|-----------|------------|----------------|
| Basic Monthly | `$rc_custom_basic_monthly` | `com.pawbalance.basic.monthly` | `prod_UHu8rUqYfEGDt7` |
| Basic Annual | `$rc_custom_basic_annual` | `com.pawbalance.basic.annual` | `prod_UHu8rUqYfEGDt7` |
| Premium Monthly | `$rc_custom_premium_monthly` | `com.pawbalance.premium.monthly` | `prod_UHu8PDP5LquhfT` |
| Premium Annual | `$rc_custom_premium_annual` | `com.pawbalance.premium.annual` | `prod_UHu8PDP5LquhfT` |

### Webhook
- URL: `https://pawbalance.optalgo.com/api/webhooks/revenuecat`
- Events: initial_purchase, renewal, product_change, cancellation, billing_issue, uncancellation, transfer, expiration, refund_reversed
- Scope: All apps (iOS + Stripe), both environments

### Stripe Customer Portal (`bpc_1TJKTjK1ftdAqm2XsWUlba6r`)
- Cancel: at period end
- Switch plans: price changes with proration
- Update payment method: enabled
- Invoice history: enabled
- Return URL: `https://pawbalance.optalgo.com/profile`

### K8s Deployment
- `SUPABASE_SERVICE_ROLE_KEY` and `REVENUECAT_WEBHOOK_SECRET` in `pawbalance-secrets`
- Readiness + liveness probes configured
- Env vars in Helm template (persisted across ArgoCD syncs)

## Code Changes

### 1. New dependency

```bash
npm install @revenuecat/purchases-js
```

### 2. New environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` | Client (build-time) | RC Billing public key for web SDK |
| `REVENUECAT_API_KEY` | Server (runtime) | RC REST API secret key for entitlement sync |

Both need to be added to: `.env.development`, `.env.production`, Docker build args in `deploy.yml`, and `secretEnv` in gitops `values.yaml`.

### 3. `src/hooks/use-purchases.ts` — Platform-aware SDK

**`initPurchases(userId?)`**
- Native: unchanged (Capacitor SDK)
- Web: import `@revenuecat/purchases-js`, call `Purchases.configure(apiKey, userId)` with `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY`

**`syncEntitlements()`**
- Remove `if (!isNative) return` guard
- Native: use Capacitor SDK `Purchases.getCustomerInfo()` (unchanged)
- Web: use web SDK `Purchases.getSharedInstance().getCustomerInfo()`
- Both: same `mapEntitlements()` → Zustand update → Supabase metadata write if tier differs

**`purchase(plan, period)`**
- Native: unchanged (Capacitor SDK → StoreKit)
- Web: use web SDK `Purchases.getSharedInstance().purchase({ rcPackage })` → triggers RC Billing in-page Stripe modal → `syncEntitlements()` after

**`restore()`**
- Native: unchanged
- Web: return `false` (not applicable, Stripe handles via portal)

**`manageSubscription()`**
- Native: unchanged (opens `itms-apps://` URL)
- Web: call `Purchases.getSharedInstance().getCustomerInfo()` → extract `managementURL` → `window.open(url, '_blank')`

### 4. `src/app/api/auth/sync-entitlements/route.ts` — New API route

Server-side entitlement sync, called once per web login session.

1. Authenticate request via Bearer token → `supabase.auth.getUser()`
2. Read current `subscription_tier` from `user_metadata`
3. Call RevenueCat REST API: `GET https://api.revenuecat.com/v1/subscribers/{user_id}` with `REVENUECAT_API_KEY`
4. Map active entitlements to tier using same logic as webhook
5. If tier differs from `user_metadata`, update via service role client
6. Return `{ tier, expiry, isTrialing }`

### 5. `src/app/providers.tsx` — Call sync on web login

After auth state change on web, call `POST /api/auth/sync-entitlements` once to ensure Supabase metadata is fresh. This covers the case where a user subscribed on iOS and opens the web app, but the webhook missed.

### 6. No UI changes needed

- **PaywallSheet**: already renders on both platforms, `purchase()` changes underneath
- **SubscriptionCard**: `manageSubscription()` already has web stub, just needs implementation
- **SubscriptionBanner**: already platform-agnostic

### 7. Webhook handler — No changes

The existing `/api/webhooks/revenuecat` handler already processes all RevenueCat events generically. Stripe subscription events flow through RevenueCat and arrive in the same normalized format as iOS events.

## Error Handling

| Scenario | Handling |
|----------|----------|
| RC Billing modal closed/failed | `purchase()` throws, paywall stays open for retry |
| Cross-platform conflict (iOS Premium + web Basic) | RevenueCat resolves — higher tier wins |
| Server-side sync API unreachable | Silent fallback to `user_metadata`, next login retries |
| Web SDK fails to load (ad blocker) | `purchase()` throws error, `syncEntitlements()` fails silently, falls back to webhook data |
| Trial already used on iOS | Stripe won't grant another trial — RevenueCat tracks cross-platform |

## Testing Plan

1. **Web purchase flow**: Create test Stripe customer, purchase Basic monthly via paywall on web, verify entitlements update in RevenueCat + Supabase
2. **Cross-platform sync**: Subscribe on iOS sandbox, log into web, verify tier shows correctly after login sync
3. **Manage subscription**: Click "Manage Subscription" on web profile, verify Stripe portal opens with correct plans
4. **Webhook delivery**: Purchase on web, verify webhook fires and updates Supabase metadata
5. **Cancel flow**: Cancel via Stripe portal, verify tier remains until period end, then drops to FREE
6. **Plan switch**: Upgrade Basic → Premium via portal, verify proration and tier change
