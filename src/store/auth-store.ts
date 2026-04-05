import { create } from "zustand";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: string | null;
  isTrialing: boolean;
  hasBillingIssue: boolean;
  isLoading: boolean;
  setAuth: (user: SupabaseUser | null, session: Session | null) => void;
  setSubscription: (tier: SubscriptionTier, expiry: string | null, isTrialing: boolean) => void;
  setBillingIssue: (has: boolean) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  subscriptionTier: "FREE",
  subscriptionExpiry: null,
  isTrialing: false,
  hasBillingIssue: false,
  isLoading: true,

  setAuth: (user, session) =>
    set({
      user,
      session,
      subscriptionTier:
        (user?.user_metadata?.subscription_tier as SubscriptionTier) ?? "FREE",
      subscriptionExpiry: user?.user_metadata?.subscription_expiry ?? null,
      isLoading: false,
    }),

  setSubscription: (subscriptionTier, subscriptionExpiry, isTrialing) =>
    set({ subscriptionTier, subscriptionExpiry, isTrialing }),

  setBillingIssue: (hasBillingIssue) => set({ hasBillingIssue }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({
      user: null,
      session: null,
      subscriptionTier: "FREE",
      subscriptionExpiry: null,
      isTrialing: false,
      hasBillingIssue: false,
      isLoading: false,
    }),
}));
