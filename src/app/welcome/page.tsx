"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const BENEFITS = [
  { icon: Icons.search, titleKey: "welcomeBenefit1", subKey: "welcomeBenefit1Sub", bg: "bg-[#E8F5E9]", iconColor: "text-primary-dark" },
  { icon: Icons.paw,    titleKey: "welcomeBenefit2", subKey: "welcomeBenefit2Sub", bg: "bg-[#FFF3E0]", iconColor: "text-caution" },
  { icon: Icons.safe,   titleKey: "welcomeBenefit3", subKey: "welcomeBenefit3Sub", bg: "bg-[#FFEBEE]", iconColor: "text-toxic" },
] as const;

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-12">
      {/* Branding */}
      <img
        src="/icons/icon-512x512.png"
        alt="PawBalance"
        className="h-[72px] w-[72px] rounded-[18px] shadow-md"
      />

      <h1 className="mt-6 text-center text-3xl font-bold text-txt">
        {t("welcomeTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-txt-secondary">
        {t("welcomeSubtitle")}
      </p>

      {/* Benefit cards */}
      <div className="mt-8 w-full max-w-xs space-y-3">
        {BENEFITS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-card bg-surface p-3.5 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${item.bg}`}>
              <item.icon className={`h-[18px] w-[18px] ${item.iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-txt">{t(item.titleKey)}</p>
              <p className="text-[11px] text-txt-secondary">{t(item.subKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-9 w-full max-w-xs">
        <button
          onClick={() => router.push("/onboarding")}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-primary-btn px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-150 ease-out motion-safe:active:scale-[0.97] active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("getStarted")}
          <Icons.chevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="mt-4 text-center text-sm text-txt-secondary">
          {t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => router.push("/login?redirect=/search")}
            className="font-semibold text-primary-dark transition-colors duration-150 active:opacity-70 focus-visible:underline focus-visible:outline-none"
          >
            {t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
