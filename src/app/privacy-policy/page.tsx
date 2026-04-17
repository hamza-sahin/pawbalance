"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppScreen } from "@/components/navigation/app-screen";

export default function PrivacyPolicyPage() {
  const t = useTranslations();
  const router = useRouter();

  const dataItems = [
    t("ppDataAccount"),
    t("ppDataPet"),
    t("ppDataFood"),
    t("ppDataPreferences"),
    t("ppDataDevice"),
  ];

  const thirdPartyItems = [
    t("ppThirdPartySupabase"),
    t("ppThirdPartyGoogle"),
    t("ppThirdPartyApple"),
    t("ppThirdPartyCapgo"),
  ];

  const sections = [
    { title: t("ppHowUsedTitle"), body: t("ppHowUsedBody") },
    { title: t("ppStorageTitle"), body: t("ppStorageBody") },
    { title: t("ppNoTrackingTitle"), body: t("ppNoTrackingBody") },
    { title: t("ppRetentionTitle"), body: t("ppRetentionBody") },
    { title: t("ppRightsTitle"), body: t("ppRightsBody") },
    { title: t("ppChildrenTitle"), body: t("ppChildrenBody") },
    { title: t("ppChangesTitle"), body: t("ppChangesBody") },
  ];

  return (
    <AppScreen
        title={t("privacyPolicy")}
        onBack={() => router.back()}
        showBack
      >
      <div className="px-4 py-6 space-y-6">
        <p className="text-sm text-txt-secondary">{t("ppIntro")}</p>
        <p className="text-sm text-txt-secondary">{t("ppOperator")}</p>

        {/* Section 1: Data Collected (has bullet list) */}
        <div>
          <h2 className="text-base font-semibold text-txt">{t("ppDataCollectedTitle")}</h2>
          <p className="mt-1.5 text-sm text-txt-secondary">{t("ppDataCollectedBody")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {dataItems.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-txt-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Third-Party Services (has bullet list) */}
        <div>
          <h2 className="text-base font-semibold text-txt">{t("ppThirdPartyTitle")}</h2>
          <p className="mt-1.5 text-sm text-txt-secondary">{t("ppThirdPartyBody")}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {thirdPartyItems.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-txt-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Remaining sections */}
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
