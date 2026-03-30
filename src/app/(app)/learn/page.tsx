"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/ui/icon";

const chipKeys = ["all", "nutrition", "safety", "recipes", "health"] as const;

export default function LearnPage() {
  const t = useTranslations();
  const [activeChip, setActiveChip] = useState("all");

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col p-4">
      <h1 className="mb-4 text-lg font-bold text-txt">{t("learn")}</h1>

      <div className="relative mb-4">
        <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-tertiary" aria-hidden="true" />
        <input
          type="text"
          placeholder={t("searchArticles")}
          className="w-full rounded-input border border-border bg-surface py-3 pl-10 pr-4 text-txt opacity-50 outline-none placeholder:text-txt-tertiary"
          disabled
          aria-label={t("searchArticles")}
        />
      </div>

      <h2 className="mb-2 font-semibold text-txt">{t("categories")}</h2>
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {chipKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveChip(key)}
            aria-pressed={activeChip === key}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeChip === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-txt-secondary hover:bg-surface-variant"
            } active:scale-95 active:opacity-80`}
          >
            {activeChip === key && <Icons.check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
            {t(key)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Icons.learn className="h-12 w-12 text-txt-tertiary" aria-hidden="true" />
        <p className="font-medium text-txt-secondary">{t("knowledgeBase")}</p>
        <p className="text-sm text-txt-tertiary">{t("articlesComingSoon")}</p>
      </div>
    </div>
  );
}
