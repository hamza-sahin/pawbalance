"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ScanHistoryPage() {
  const t = useTranslations();

  return (
    <div className="p-4">
      <Link href="/profile" className="mb-4 inline-block text-txt-secondary hover:text-txt">
        ← Back
      </Link>
      <h1 className="mb-4 text-lg font-bold text-txt">{t("scanHistory")}</h1>

      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-5xl text-txt-tertiary">🕒</span>
        <p className="font-medium text-txt-secondary">{t("comingSoon")}</p>
      </div>
    </div>
  );
}
