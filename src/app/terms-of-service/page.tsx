"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

export default function TermsOfServicePage() {
  const t = useTranslations();
  const router = useRouter();

  const sections = [
    { title: t("tosServiceTitle"), body: t("tosServiceBody") },
    { title: t("tosEligibilityTitle"), body: t("tosEligibilityBody") },
    { title: t("tosAccountsTitle"), body: t("tosAccountsBody") },
    { title: t("tosAcceptableUseTitle"), body: t("tosAcceptableUseBody") },
    { title: t("tosIpTitle"), body: t("tosIpBody") },
    { title: t("tosDisclaimerTitle"), body: t("tosDisclaimerBody") },
    { title: t("tosLiabilityTitle"), body: t("tosLiabilityBody") },
    { title: t("tosTerminationTitle"), body: t("tosTerminationBody") },
    { title: t("tosGoverningLawTitle"), body: t("tosGoverningLawBody") },
    { title: t("tosChangesTitle"), body: t("tosChangesBody") },
  ];

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("termsOfService")}</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        <p className="text-sm text-txt-secondary">{t("tosIntro")}</p>
        <p className="text-sm text-txt-secondary">{t("tosOperator")}</p>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold text-txt">{section.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">
              {section.body}
            </p>
          </div>
        ))}

        <p className="text-xs text-txt-tertiary">
          {t("termsLastUpdated", { date: "March 31, 2026" })}
        </p>
      </div>
    </div>
  );
}
