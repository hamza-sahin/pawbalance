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
 * Routes not listed here default to "guest" (accessible by everyone).
 */
const ROUTE_ACCESS: Record<string, AccessTier> = {
  "/search": "guest",
  "/profile": "free",
  "/recipes": "free",
  "/learn": "guest",
  "/scan": "free",
};

export function resolveUserTier(
  session: Session | null,
  subscriptionTier: SubscriptionTier,
): AccessTier {
  if (!session) return "guest";
  switch (subscriptionTier) {
    case "PREMIUM":
      return "premium";
    default:
      return "free";
  }
}

export function getRequiredTier(pathname: string): AccessTier {
  // Match against route prefixes — longest match wins
  const match = Object.keys(ROUTE_ACCESS)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_ACCESS[match] : "guest";
}

export function canAccess(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

/**
 * Returns the reason access was denied.
 * Used by the layout to decide whether to show LoginSheet or PaywallSheet.
 */
export function getAccessGateReason(
  session: Session | null,
  userTier: AccessTier,
  requiredTier: AccessTier,
): "none" | "login" | "paywall" {
  if (canAccess(userTier, requiredTier)) return "none";
  if (!session) return "login";
  return "paywall";
}
