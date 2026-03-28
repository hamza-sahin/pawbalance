import { create } from "zustand";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/types";

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
  setAuth: (user: SupabaseUser | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  subscriptionTier: "FREE",
  isLoading: true,

  setAuth: (user, session) =>
    set({
      user,
      session,
      subscriptionTier:
        (user?.user_metadata?.subscription_tier as SubscriptionTier) ?? "FREE",
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({
      user: null,
      session: null,
      subscriptionTier: "FREE",
      isLoading: false,
    }),
}));
