"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppScreen } from "@/components/navigation/app-screen";

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
    <AppScreen
        title={t("termsOfService")}
        onBack={() => router.back()}
        showBack
        shellMode="stacked"
      >
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
    </AppScreen>
  );
}
