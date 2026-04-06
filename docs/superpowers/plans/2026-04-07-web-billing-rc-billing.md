# Web Billing via RC Billing + Stripe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable web subscription purchases via RevenueCat RC Billing (Stripe) so both iOS and web share a single RevenueCat dashboard.

**Architecture:** The existing `use-purchases.ts` hook becomes platform-aware — native uses the Capacitor SDK, web uses `@revenuecat/purchases-js`. A new server-side API route (`/api/auth/sync-entitlements`) calls the RevenueCat REST API on login to catch missed webhooks. No UI changes needed — the PaywallSheet already works on both platforms.

**Tech Stack:** `@revenuecat/purchases-js` (RC Billing web SDK), RevenueCat REST API v1, Next.js API routes, Supabase auth

**Spec:** `docs/superpowers/specs/2026-04-07-web-billing-rc-billing-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `@revenuecat/purchases-js` dependency |
| `.env.development` | Modify | Add `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` |
| `.env.production` | Modify | Add `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` |
| `src/hooks/use-purchases.ts` | Modify | Platform-aware init, sync, purchase, restore, manage |
| `src/app/api/auth/sync-entitlements/route.ts` | Create | Server-side RevenueCat REST API entitlement check |
| `src/app/providers.tsx` | Modify | Call sync-entitlements on web login |
| `.github/workflows/deploy.yml` | Modify | Add `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` to Docker build args |
| `refs/gitops/helm/pawbalance/values.yaml` | Modify | Add `REVENUECAT_API_KEY` to `secretEnv` |

---

## Task 1: Install RC Web SDK and add env vars

**Files:**
- Modify: `package.json`
- Modify: `.env.development`
- Modify: `.env.production`

- [ ] **Step 1: Install the web SDK**

```bash
npm install @revenuecat/purchases-js
```

- [ ] **Step 2: Add web API key to `.env.development`**

Append to `.env.development`:

```
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=rcb_PLACEHOLDER_DEV
```

Note: Replace `rcb_PLACEHOLDER_DEV` with the actual RC Billing public API key from the RevenueCat dashboard (Project → Paw Balance (Stripe) app → API Keys).

- [ ] **Step 3: Add web API key to `.env.production`**

Append to `.env.production`:

```
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=rcb_PLACEHOLDER_PROD
```

- [ ] **Step 4: Verify TypeScript can resolve the module**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors related to `@revenuecat/purchases-js`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.development .env.production
git commit -m "feat: install @revenuecat/purchases-js and add web API key env vars"
```

---

## Task 2: Make `initPurchases` platform-aware

**Files:**
- Modify: `src/hooks/use-purchases.ts`

- [ ] **Step 1: Update `initPurchases` to initialize web SDK on non-native**

Replace the entire `initPurchases` function in `src/hooks/use-purchases.ts` with:

```typescript
/** Initialize RevenueCat SDK. Call once on app startup. */
export async function initPurchases(userId?: string): Promise<void> {
  if (isNative) {
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY;
    if (!apiKey) return;

    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.configure({ apiKey });

    if (userId) {
      await Purchases.logIn({ appUserID: userId });
    }
  } else {
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY;
    if (!apiKey || !userId) return;

    const { Purchases } = await import("@revenuecat/purchases-js");
    Purchases.configure(apiKey, userId);
  }

  await syncEntitlements();
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-purchases.ts
git commit -m "feat: initialize RC web SDK on non-native platforms"
```

---

## Task 3: Make `syncEntitlements` platform-aware

**Files:**
- Modify: `src/hooks/use-purchases.ts`

- [ ] **Step 1: Update `syncEntitlements` to work on both platforms**

Replace the entire `syncEntitlements` function in `src/hooks/use-purchases.ts` with:

```typescript
/** Sync RevenueCat entitlements to Zustand store and Supabase user_metadata. */
export async function syncEntitlements(): Promise<void> {
  try {
    let customerInfo: any;

    if (isNative) {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const raw = await Purchases.getCustomerInfo();
      customerInfo = extractCustomerInfo(raw);
    } else {
      const { Purchases } = await import("@revenuecat/purchases-js");
      try {
        customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      } catch {
        // Web SDK not initialized yet (no user logged in) — skip
        return;
      }
    }

    const { tier, expiry, isTrialing } = mapEntitlements(
      customerInfo.entitlements.active as any,
    );
    useAuthStore.getState().setSubscription(tier, expiry, isTrialing);

    // Persist to Supabase user_metadata as fallback in case the
    // RevenueCat webhook failed (e.g. during a pod rollout).
    const currentMeta = useAuthStore.getState().user?.user_metadata;
    if (currentMeta?.subscription_tier !== tier) {
      getSupabase().auth.updateUser({
        data: { subscription_tier: tier, subscription_expiry: expiry },
      });
    }
  } catch (err) {
    console.error("[syncEntitlements] Error:", err);
  }
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-purchases.ts
git commit -m "feat: make syncEntitlements work on web via RC web SDK"
```

---

## Task 4: Make `purchase`, `restore`, `manageSubscription` platform-aware

**Files:**
- Modify: `src/hooks/use-purchases.ts`

- [ ] **Step 1: Update the `purchase` callback**

Replace the `purchase` callback inside `usePurchases()` with:

```typescript
  const purchase = useCallback(
    async (plan: PlanKey, period: Period): Promise<boolean> => {
      if (isNative) {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");

        try {
          const offerings = await Purchases.getOfferings();
          const current = offerings.current;
          if (!current) throw new Error("No offerings available");

          const targetPkg = current.availablePackages.find((p) => {
            const id = p.product.identifier;
            return id.includes(plan) && id.includes(period === "annual" ? "annual" : "monthly");
          });

          if (!targetPkg) throw new Error(`Package not found: ${plan} ${period}`);

          await Purchases.purchasePackage({ aPackage: targetPkg });

          await syncEntitlements();
          return true;
        } catch (err: any) {
          const code = String(err?.code ?? "");
          if (code === "1") return false;
          if (code === "6") {
            await syncEntitlements();
            return useAuthStore.getState().subscriptionTier !== "FREE";
          }
          await syncEntitlements();
          if (useAuthStore.getState().subscriptionTier !== "FREE") {
            return true;
          }
          throw err;
        }
      }

      // Web: RC Billing (Stripe)
      const { Purchases } = await import("@revenuecat/purchases-js");
      const instance = Purchases.getSharedInstance();

      const offerings = await instance.getOfferings();
      const current = offerings.current;
      if (!current) throw new Error("No offerings available");

      const targetPkg = current.availablePackages.find((p) => {
        const id = p.rcBillingProduct?.identifier ?? p.webBillingProduct?.identifier ?? "";
        return id.includes(plan) && id.includes(period === "annual" ? "annual" : "monthly");
      });

      if (!targetPkg) throw new Error(`Package not found: ${plan} ${period}`);

      const { customerInfo } = await instance.purchase({ rcPackage: targetPkg });
      const { tier, expiry, isTrialing } = mapEntitlements(
        customerInfo.entitlements.active as any,
      );
      useAuthStore.getState().setSubscription(tier, expiry, isTrialing);

      const currentMeta = useAuthStore.getState().user?.user_metadata;
      if (currentMeta?.subscription_tier !== tier) {
        getSupabase().auth.updateUser({
          data: { subscription_tier: tier, subscription_expiry: expiry },
        });
      }

      return true;
    },
    [setSubscription],
  );
```

- [ ] **Step 2: Update the `restore` callback**

The `restore` callback is unchanged — it already returns `false` on web. No changes needed.

- [ ] **Step 3: Update the `manageSubscription` callback**

Replace the `manageSubscription` callback with:

```typescript
  const manageSubscription = useCallback(async () => {
    if (isNative) {
      const { AppLauncher } = await import("@capacitor/app-launcher");
      await AppLauncher.openUrl({
        url: "itms-apps://apps.apple.com/account/subscriptions",
      });
    } else {
      const { Purchases } = await import("@revenuecat/purchases-js");
      try {
        const info = await Purchases.getSharedInstance().getCustomerInfo();
        const url = info.managementURL;
        if (url) {
          window.open(url, "_blank");
        }
      } catch {
        // Fallback: open Stripe portal login page directly
        window.open("https://billing.stripe.com/p/login/bJe7sM2zS4M6bf02yC2sM00", "_blank");
      }
    }
  }, []);
```

- [ ] **Step 4: Verify no type errors**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-purchases.ts
git commit -m "feat: web purchase via RC Billing and manage subscription via Stripe portal"
```

---

## Task 5: Create server-side entitlement sync API route

**Files:**
- Create: `src/app/api/auth/sync-entitlements/route.ts`

- [ ] **Step 1: Create the API route**

Create `src/app/api/auth/sync-entitlements/route.ts`:

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
  // 1. Authenticate via Supabase
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing token" }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  // 2. Read current tier from user_metadata
  const currentTier = user.user_metadata?.subscription_tier ?? "FREE";

  // 3. Fetch entitlements from RevenueCat REST API
  const rcApiKey = process.env.REVENUECAT_API_KEY;
  if (!rcApiKey) {
    // No API key configured — return current tier without syncing
    return Response.json({
      tier: currentTier,
      expiry: user.user_metadata?.subscription_expiry ?? null,
      synced: false,
    }, { headers: corsHeaders });
  }

  let rcTier: SubscriptionTier = "FREE";
  let rcExpiry: string | null = null;

  try {
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${user.id}`,
      { headers: { Authorization: `Bearer ${rcApiKey}` } },
    );

    if (rcResponse.ok) {
      const rcData = await rcResponse.json();
      const entitlements = rcData.subscriber?.entitlements ?? {};

      const activeEntitlements = Object.keys(entitlements).filter((key) => {
        const ent = entitlements[key];
        return ent.expires_date === null || new Date(ent.expires_date) > new Date();
      });

      rcTier = mapTier(activeEntitlements);

      // Find latest expiry
      for (const key of activeEntitlements) {
        const ent = entitlements[key];
        if (ent.expires_date && (!rcExpiry || ent.expires_date > rcExpiry)) {
          rcExpiry = ent.expires_date;
        }
      }
    }
  } catch {
    // RevenueCat API unreachable — return current tier
    return Response.json({
      tier: currentTier,
      expiry: user.user_metadata?.subscription_expiry ?? null,
      synced: false,
    }, { headers: corsHeaders });
  }

  // 4. Update Supabase if tier differs
  if (rcTier !== currentTier) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        subscription_tier: rcTier,
        subscription_expiry: rcExpiry,
      },
    });
  }

  return Response.json({
    tier: rcTier,
    expiry: rcExpiry,
    synced: rcTier !== currentTier,
  }, { headers: corsHeaders });
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/sync-entitlements/route.ts
git commit -m "feat: add server-side entitlement sync API route"
```

---

## Task 6: Call sync-entitlements on web login

**Files:**
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Add entitlement sync call after auth state change on web**

In `src/app/providers.tsx`, add a new `useEffect` after the existing RevenueCat init effect. Add the import for `getApiUrl` at the top:

Add this import at the top of the file:

```typescript
import { getApiUrl } from "@/lib/api";
```

Add this effect after the `// Init RevenueCat after auth is ready` effect (after line 26):

```typescript
  // Web: sync entitlements from RevenueCat REST API on login
  useEffect(() => {
    if (isNative || isLoading || !session?.access_token) return;

    fetch(getApiUrl("/api/auth/sync-entitlements"), {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {
      // Silent failure — webhook data is the fallback
    });
  }, [isLoading, session?.access_token]);
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/providers.tsx
git commit -m "feat: sync entitlements from RevenueCat REST API on web login"
```

---

## Task 7: Add env vars to CI/CD and GitOps

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `refs/gitops/helm/pawbalance/values.yaml`

- [ ] **Step 1: Add `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` to Docker build args**

In `.github/workflows/deploy.yml`, find the `build-args` section (around line 90-94) and add the new key:

```yaml
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}
            NEXT_PUBLIC_API_URL=https://pawbalance.optalgo.com
            NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY=${{ secrets.REVENUECAT_APPLE_API_KEY }}
            NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=${{ secrets.REVENUECAT_WEB_API_KEY }}
```

Also add it to the static build job's env section (around line 24-28):

```yaml
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_API_URL: https://pawbalance.optalgo.com
          NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY: ${{ secrets.REVENUECAT_APPLE_API_KEY }}
          NEXT_PUBLIC_REVENUECAT_WEB_API_KEY: ${{ secrets.REVENUECAT_WEB_API_KEY }}
```

- [ ] **Step 2: Add `REVENUECAT_API_KEY` to gitops secretEnv**

In `refs/gitops/helm/pawbalance/values.yaml`, add `REVENUECAT_API_KEY` to the `secretEnv` section:

```yaml
secretEnv:
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGci..."
  REVENUECAT_WEBHOOK_SECRET: "999ce96d..."
  REVENUECAT_API_KEY: "PLACEHOLDER_RC_SECRET_API_KEY"
```

Note: Replace `PLACEHOLDER_RC_SECRET_API_KEY` with the actual RevenueCat V1 secret API key from the RevenueCat dashboard (Project Settings → API Keys → V1 secret key).

- [ ] **Step 3: Add `REVENUECAT_API_KEY` to K8s secret**

```bash
kubectl -n pawbalance get secret pawbalance-secrets -o json | \
  python3 -c "
import sys, json, base64
d = json.load(sys.stdin)
d['data']['REVENUECAT_API_KEY'] = base64.b64encode(b'PLACEHOLDER_RC_SECRET_API_KEY').decode()
json.dump(d, sys.stdout)
" | kubectl apply -f -
```

Note: Replace `PLACEHOLDER_RC_SECRET_API_KEY` with the actual key before running.

- [ ] **Step 4: Add `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` to gitops env**

In `refs/gitops/helm/pawbalance/values.yaml`, add to the `env` section:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: "https://wfruynvxajqbosiharmy.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_AgvD8qYPJuhdaCsVeYd0gw_SBwwKozD"
  NEXT_PUBLIC_API_URL: "https://pawbalance.optalgo.com"
  NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY: "appl_kDaRxMgycMItYsDVKRZTJqcgFzM"
  NEXT_PUBLIC_REVENUECAT_WEB_API_KEY: "PLACEHOLDER_RC_WEB_KEY"
```

- [ ] **Step 5: Commit deploy.yml changes**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add RC web API key to Docker build args and static build env"
```

- [ ] **Step 6: Commit gitops changes**

```bash
cd refs/gitops
git add helm/pawbalance/values.yaml
git commit -m "feat: add REVENUECAT_API_KEY secret and web API key env var"
git push origin main
cd -
```

---

## Task 8: Build verification

- [ ] **Step 1: Verify static build succeeds**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build completes without errors. The new API route will be skipped during static export (POST-only handler).

- [ ] **Step 2: Verify server build succeeds**

```bash
BUILD_MODE=server npm run build 2>&1 | tail -10
```

Expected: Build completes without errors. The new API route is included in the server build.

- [ ] **Step 3: Type check passes**

```bash
npx tsc --noEmit --pretty 2>&1 | tail -5
```

Expected: No errors.
