"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { LoginSheet } from "@/components/auth/LoginSheet";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";
import { usePurchases } from "@/hooks/use-purchases";
import { resolveUserTier, getRequiredTier, getAccessGateReason } from "@/lib/access";
import type { AccessTier } from "@/lib/access";
import { shouldShowBottomNav } from "@/lib/navigation";
import { shouldRequireTerms } from "@/lib/terms";

const ONBOARDING_KEY = "onboarding_completed";
const GUEST_PET_KEY = "guest_pet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, subscriptionTier, isLoading: authLoading } = useAuthStore();
  const { pets, isLoading: petsLoading, fetchPets, loadGuestPet, syncGuestPet } = usePets();
  const router = useRouter();
  const pathname = usePathname();
  const { manageSubscription } = usePurchases();
  const [paywallTier, setPaywallTier] = useState<AccessTier | null>(null);
  const showBottomNav = shouldShowBottomNav(pathname);

  // Fetch pets when authenticated, load guest pet otherwise
  useEffect(() => {
    if (authLoading) return;
    if (session) {
      fetchPets();
      syncGuestPet();
    } else {
      loadGuestPet();
    }
  }, [authLoading, session, fetchPets, loadGuestPet, syncGuestPet]);

  // Redirect to terms acceptance if needed
  useEffect(() => {
    if (authLoading) return;
    if (shouldRequireTerms(!!session, session?.user?.user_metadata)) {
      router.replace("/terms");
    }
  }, [authLoading, session, router]);

  // Redirect to onboarding if needed (skip if terms gate takes priority)
  useEffect(() => {
    if (authLoading || petsLoading) return;
    if (shouldRequireTerms(!!session, session?.user?.user_metadata)) return;

    const onboardingDone =
      typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "true";
    const hasGuestPet =
      typeof window !== "undefined" && localStorage.getItem(GUEST_PET_KEY) !== null;

    if (!onboardingDone && !hasGuestPet) {
      if (!session || (session && pets.length === 0)) {
        router.replace("/welcome");
      }
    }
  }, [authLoading, petsLoading, session, pets.length, router]);

  // Determine access gate for current route
  const userTier = resolveUserTier(session, subscriptionTier);
  const requiredTier = getRequiredTier(pathname);
  const gateReason = getAccessGateReason(session, userTier, requiredTier);
  const showLoginSheet = gateReason === "login";

  // Show spinner only during initial auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto min-h-screen max-w-md bg-canvas md:max-w-lg lg:max-w-2xl ${
        showBottomNav ? "pb-20" : ""
      }`}
    >
      <SubscriptionBanner
        onSubscribeClick={() => setPaywallTier("basic")}
        onManageClick={manageSubscription}
      />
      {(gateReason === "none" || gateReason === "paywall") && children}
      {showLoginSheet ? (
        <LoginSheet onDismiss={() => router.replace("/search")} />
      ) : null}
      {paywallTier && (
        <PaywallSheet
          requiredTier={paywallTier}
          onDismiss={() => setPaywallTier(null)}
        />
      )}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
