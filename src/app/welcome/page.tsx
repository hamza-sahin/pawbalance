"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();

  const benefits = [
    { icon: Icons.search, text: t("welcomeBenefit1") },
    { icon: Icons.paw, text: t("welcomeBenefit2") },
    { icon: Icons.safe, text: t("welcomeBenefit3") },
  ];

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-between bg-canvas px-6 py-12">
      {/* Top section: branding + value props */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* App logo */}
        <img
          src="/logo.png"
          alt="PawBalance"
          className="h-16 w-auto"
        />

        <h1 className="mt-6 text-center text-3xl font-bold text-txt">
          {t("welcomeTitle")}
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-txt-secondary">
          {t("welcomeSubtitle")}
        </p>

        {/* Benefits */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          {benefits.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-[18px] w-[18px] text-primary-dark" aria-hidden="true" />
              </div>
              <span className="text-sm text-txt">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section: CTAs */}
      <div className="w-full max-w-xs pt-8">
        <button
          onClick={() => router.push("/onboarding")}
          className="w-full rounded-button bg-primary-btn px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-150 ease-out active:scale-[0.97] active:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("getStarted")}
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
