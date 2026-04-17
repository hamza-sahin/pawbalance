"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { acceptTerms, getAcceptedTermsVersion } from "@/lib/terms";
import { AppScreen } from "@/components/navigation/app-screen";
import { Icons } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { session, user } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isReConsent =
    getAcceptedTermsVersion(user?.user_metadata) > 0;

  async function handleAccept() {
    setIsLoading(true);
    try {
      await acceptTerms(!!session);
      router.replace("/search");
    } catch {
      // Retry silently — if Supabase is unreachable, the gate will re-show on next load
      setIsLoading(false);
    }
  }

  return (
    <AppScreen
      title={isReConsent ? t("termsUpdatedTitle") : t("termsTitle")}
      contentClassName="px-6 py-12"
    >
      <div className="flex min-h-dvh flex-col items-center justify-between">
        {/* Top: branding + info */}
        <div className="flex flex-1 flex-col items-center justify-center">
        {/* App icon */}
        <img
          src="/icons/icon-512x512.png"
          alt="PawBalance"
          className="h-20 w-20 rounded-[22px] shadow-md"
        />

        <p className="mt-2 max-w-xs text-center text-sm text-txt-secondary">
          {t("termsSubtitle")}
        </p>

        {/* Document links */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push("/terms-of-service")}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3.5 transition-colors active:bg-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icons.fileText className="h-[18px] w-[18px] text-primary-dark" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-txt">{t("termsOfService")}</span>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </button>

          <button
            onClick={() => router.push("/privacy-policy")}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3.5 transition-colors active:bg-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icons.shield className="h-[18px] w-[18px] text-primary-dark" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-txt">{t("privacyPolicy")}</span>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </button>
        </div>
      </div>

        {/* Bottom: checkbox + continue */}
        <div className="w-full max-w-xs pt-8">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <span className="text-sm leading-snug text-txt-secondary">
              {t("termsCheckbox")}
            </span>
          </label>

          <Button
            onClick={handleAccept}
            disabled={!agreed}
            isLoading={isLoading}
            fullWidth
            className="mt-4"
          >
            {t("termsContinue")}
          </Button>
        </div>
      </div>
    </AppScreen>
  );
}
