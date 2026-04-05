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
