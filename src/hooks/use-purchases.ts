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

        const purchaseResult = await Purchases.purchasePackage({
          aPackage: targetPkg,
        });

        const result = mapEntitlements(purchaseResult.customerInfo.entitlements.active as any);
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
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({
        url: "https://apps.apple.com/account/subscriptions",
      });
    }
  }, []);

  return { purchase, restore, manageSubscription, syncEntitlements };
}
