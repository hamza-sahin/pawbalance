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
  if (!required) return true;
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
