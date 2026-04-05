import type { Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

export type AccessTier = "guest" | "free" | "basic" | "premium";

const TIER_LEVEL: Record<AccessTier, number> = {
  guest: 0,
  free: 1,
  basic: 2,
  premium: 3,
};

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
