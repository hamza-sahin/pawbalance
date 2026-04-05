"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useSheetDrag } from "@/hooks/use-sheet-drag";
import { isNative } from "@/lib/platform";
import { Icons } from "@/components/ui/icon";

interface LoginSheetProps {
  /** Called when user dismisses the sheet via "Not now" or Escape */
  onDismiss: () => void;
}

export function LoginSheet({ onDismiss }: LoginSheetProps) {
  const t = useTranslations();
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
    setTimeout(onDismiss, delay);
  }, [onDismiss]);

  const { sheetRef, maximized, handlers: dragHandlers } = useSheetDrag({ onDismiss: handleDismiss });

  // Animate in on mount + move focus into the sheet
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
    } else {
      requestAnimationFrame(() => setVisible(true));
    }
    sheetRef.current?.focus();
  }, []);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by auth
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch {
      // Error handled by auth
    } finally {
      setAppleLoading(false);
    }
  }

  function handleEmail() {
    router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
  }

  const btnFocus = "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 motion-reduce:transition-none ${visible ? "opacity-40" : "opacity-0"}`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        {...dragHandlers}
        tabIndex={-1}
        className={`relative w-full max-w-md bg-surface px-5 pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-[transform,border-radius,max-height] duration-200 ease-out motion-reduce:transition-none ${visible ? "translate-y-0" : "translate-y-full"} ${
          maximized
            ? "rounded-t-none max-h-[100dvh] overflow-y-auto"
            : "rounded-t-[20px]"
        }`}
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
        aria-label={t("loginSheetTitle")}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-border" />

        {/* Header */}
        <h2 className="text-center text-lg font-bold text-txt">{t("loginSheetTitle")}</h2>
        <p className="mt-1 text-center text-sm text-txt-secondary">{t("loginSheetSubtitle")}</p>

        {/* Value prop */}
        <div className="mt-4 rounded-card bg-canvas p-3.5">
          {[
            { icon: Icons.paw, text: t("loginSheetBenefitCloud") },
            { icon: Icons.bowl, text: t("loginSheetBenefitMeals") },
            { icon: Icons.learn, text: t("loginSheetBenefitLearn") },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2.5 ${i > 0 ? "mt-2.5" : ""}`}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="text-[13px] text-txt">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button bg-txt px-5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-out active:scale-95 active:opacity-90 disabled:opacity-50 ${btnFocus}`}
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {t("continueWithGoogle")}
          </button>

          <button
            onClick={handleEmail}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button border border-border bg-surface px-5 py-3.5 text-[15px] font-semibold text-txt transition-all duration-150 ease-out active:scale-95 active:opacity-90 ${btnFocus}`}
          >
            <Icons.mail className="h-[18px] w-[18px]" aria-hidden="true" />
            {t("continueWithEmail")}
          </button>

          {isNative && (
            <button
              onClick={handleApple}
              disabled={appleLoading}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-button bg-black px-5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-out active:scale-95 active:opacity-90 disabled:opacity-50 ${btnFocus}`}
            >
              {appleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.02 8.79 8.76c1.23.06 2.09.7 2.81.73.88-.18 1.73-.85 2.91-.77 1.37.1 2.39.61 3.07 1.57-2.78 1.68-2.12 5.39.47 6.42-.56 1.49-1.28 2.96-2.51 4.09l1.51-1.52zM12.05 8.68c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {t("continueWithApple")}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className={`mt-1 w-full cursor-pointer py-2.5 text-center text-sm text-txt-secondary transition-all duration-150 ease-out active:opacity-70 ${btnFocus}`}
          >
            {t("notNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
