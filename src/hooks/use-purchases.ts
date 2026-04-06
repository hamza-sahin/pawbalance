import { useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { isNative } from "@/lib/platform";
import { getSupabase } from "@/lib/supabase";
import type { SubscriptionTier } from "@/lib/types";

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

/**
 * Safely extract CustomerInfo from SDK responses.
 * The Capacitor bridge may return { customerInfo: ... } or the CustomerInfo directly.
 */
function extractCustomerInfo(result: any): any {
  return result?.customerInfo ?? result;
}

/** Persist tier to Supabase user_metadata if it differs from current. */
function persistTierIfChanged(tier: SubscriptionTier, expiry: string | null): void {
  const currentMeta = useAuthStore.getState().user?.user_metadata;
  if (currentMeta?.subscription_tier !== tier) {
    getSupabase().auth.updateUser({
      data: { subscription_tier: tier, subscription_expiry: expiry },
    });
  }
}

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
    persistTierIfChanged(tier, expiry);
  } catch (err) {
    console.error("[syncEntitlements] Error:", err);
  }
}

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

export function usePurchases() {
  const { setSubscription } = useAuthStore();

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
        const id = p.webBillingProduct?.identifier ?? p.rcBillingProduct?.identifier ?? "";
        return id.includes(plan) && id.includes(period === "annual" ? "annual" : "monthly");
      });

      if (!targetPkg) throw new Error(`Package not found: ${plan} ${period}`);

      const { customerInfo } = await instance.purchase({ rcPackage: targetPkg });
      const { tier, expiry, isTrialing } = mapEntitlements(
        customerInfo.entitlements.active as any,
      );
      useAuthStore.getState().setSubscription(tier, expiry, isTrialing);
      persistTierIfChanged(tier, expiry);

      return true;
    },
    [setSubscription],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      await Purchases.restorePurchases();
    } catch {
      // restorePurchases may throw if no purchases to restore — ignore
    }

    await syncEntitlements();
    return useAuthStore.getState().subscriptionTier !== "FREE";
  }, []);

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

  return { purchase, restore, manageSubscription, syncEntitlements };
}
