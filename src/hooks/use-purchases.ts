import { useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { isNative } from "@/lib/platform";
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

/** Sync RevenueCat entitlements to Zustand store. */
export async function syncEntitlements(): Promise<void> {
  if (!isNative) return;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const raw = await Purchases.getCustomerInfo();
    const customerInfo = extractCustomerInfo(raw);
    const { tier, expiry, isTrialing } = mapEntitlements(
      customerInfo.entitlements.active as any,
    );
    useAuthStore.getState().setSubscription(tier, expiry, isTrialing);
  } catch (err) {
    console.error("[syncEntitlements] Error:", err);
  }
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
  const { setSubscription } = useAuthStore();

  const purchase = useCallback(
    async (plan: PlanKey, period: Period): Promise<boolean> => {
      if (!isNative) {
        // Web: future RC Billing implementation
        return false;
      }

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

        // Re-fetch entitlements after purchase to get reliable state
        await syncEntitlements();
        return true;
      } catch (err: any) {
        const code = String(err?.code ?? "");
        // "1" = PURCHASE_CANCELLED_ERROR
        if (code === "1") return false;
        // "6" = PRODUCT_ALREADY_PURCHASED_ERROR — sync and treat as success
        if (code === "6") {
          await syncEntitlements();
          return useAuthStore.getState().subscriptionTier !== "FREE";
        }
        // For any other error, still try syncing entitlements as fallback —
        // Apple may have processed the purchase even if RevenueCat threw
        await syncEntitlements();
        if (useAuthStore.getState().subscriptionTier !== "FREE") {
          return true;
        }
        throw err;
      }
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

    // Always re-fetch entitlements regardless
    await syncEntitlements();
    return useAuthStore.getState().subscriptionTier !== "FREE";
  }, []);

  const manageSubscription = useCallback(async () => {
    if (isNative) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({
        url: "https://apps.apple.com/account/subscriptions",
      });
    }
  }, []);

  return { purchase, restore, manageSubscription, syncEntitlements };
}
