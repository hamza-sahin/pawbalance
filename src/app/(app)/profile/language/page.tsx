"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { AppScreen } from "@/components/navigation/app-screen";
import { Card } from "@/components/ui/card";

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export default function LanguagePage() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  return (
    <AppScreen title={t("language")} showBack backHref="/profile" withBottomNavSpacing contentClassName="p-4">
      <div className="flex flex-col gap-2">
        {locales.map((l) => (
          <button key={l.code} onClick={() => setLocale(l.code)} className="transition-all duration-150 ease-out active:scale-95 active:opacity-80">
            <Card
              className={`flex items-center gap-3 p-4 ${
                locale === l.code ? "border-primary" : ""
              }`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="flex-1 text-left font-medium text-txt">{l.label}</span>
              {locale === l.code && <span className="text-primary">✓</span>}
            </Card>
          </button>
        ))}
      </div>
    </AppScreen>
  );
}
