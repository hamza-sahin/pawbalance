"use client";

import { type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";
import { resolveUserTier, canAccess, type AccessTier } from "@/lib/access";

interface RequireAccessProps {
  /** Minimum tier required to see children */
  tier: AccessTier;
  /** Rendered when user's tier is insufficient. Defaults to null (render nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireAccess({ tier, fallback = null, children }: RequireAccessProps) {
  const { session, subscriptionTier } = useAuthStore();
  const userTier = resolveUserTier(session, subscriptionTier);

  if (canAccess(userTier, tier)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
