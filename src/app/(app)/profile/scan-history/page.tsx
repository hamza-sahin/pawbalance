"use client";

import { useTranslations } from "next-intl";
import { AppScreen } from "@/components/navigation/app-screen";

export default function ScanHistoryPage() {
  const t = useTranslations();

  return (
    <AppScreen title={t("scanHistory")} showBack backHref="/profile" shellMode="stacked" contentClassName="p-4">
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-5xl text-txt-tertiary">🕒</span>
        <p className="font-medium text-txt-secondary">{t("comingSoon")}</p>
      </div>
    </AppScreen>
  );
}
