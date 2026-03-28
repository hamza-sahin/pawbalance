"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const chipKeys = ["all", "nutrition", "safety", "recipes", "health"] as const;

export default function LearnPage() {
  const t = useTranslations();
  const [activeChip, setActiveChip] = useState("all");

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold text-txt">{t("learn")}</h1>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-tertiary">🔍</span>
        <input
          type="text"
          placeholder={t("searchArticles")}
          className="w-full rounded-input border border-border bg-surface py-3 pl-10 pr-4 text-txt outline-none placeholder:text-txt-tertiary focus:border-primary"
          disabled
        />
      </div>

      <h2 className="mb-2 font-semibold text-txt">{t("categories")}</h2>
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {chipKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveChip(key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeChip === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-txt-secondary hover:bg-surface-variant"
            }`}
          >
            {activeChip === key && "✓ "}
            {t(key)}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-5xl text-txt-tertiary">📚</span>
        <p className="font-medium text-txt-secondary">{t("knowledgeBase")}</p>
        <p className="text-sm text-txt-tertiary">{t("articlesComingSoon")}</p>
      </div>
    </div>
  );
}
