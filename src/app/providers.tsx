"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthListener } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { initOtaUpdates, setOnUpdateReady, reloadApp, isNative } from "@/lib/platform";
import { initPurchases, syncEntitlements } from "@/hooks/use-purchases";
import { getApiUrl } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthListener();
  const t = useTranslations();
  const [updateReady, setUpdateReady] = useState(false);

  // Init OTA updates
  useEffect(() => {
    setOnUpdateReady(() => setUpdateReady(true));
    initOtaUpdates();
  }, []);

  // Init RevenueCat after auth is ready
  const { session, isLoading } = useAuthStore();
  useEffect(() => {
    if (isLoading) return;
    initPurchases(session?.user?.id);
  }, [isLoading, session?.user?.id]);

  // Web: sync entitlements from RevenueCat REST API on login
  useEffect(() => {
    if (isNative || isLoading || !session?.access_token) return;

    fetch(getApiUrl("/api/auth/sync-entitlements"), {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.synced) {
          useAuthStore.getState().setSubscription(data.tier, data.expiry, false);
        }
      })
      .catch(() => {
        // Silent failure — webhook data is the fallback
      });
  }, [isLoading, session?.access_token]);

  // Re-sync entitlements on app foreground
  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) syncEntitlements();
      });
      cleanup = () => listener.remove();
    })();

    return () => cleanup?.();
  }, []);

  // Web: periodic re-sync every 15 minutes
  useEffect(() => {
    if (isNative) return;
    const interval = setInterval(syncEntitlements, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children}
      {updateReady && (
        <div className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-lg">
            <p className="flex-1 text-sm font-medium text-txt">
              {t("updateReady")}
            </p>
            <button
              onClick={() => reloadApp()}
              className="shrink-0 rounded-button bg-primary-btn px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out active:scale-95"
            >
              {t("updateNow")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
