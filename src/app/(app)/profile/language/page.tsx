"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Card } from "@/components/ui/card";

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export default function LanguagePage() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  return (
    <div className="p-4">
      <Link href="/profile" className="mb-4 inline-block text-txt-secondary transition-opacity duration-150 hover:text-txt active:opacity-50">
        ← Back
      </Link>
      <h1 className="mb-4 text-lg font-bold text-txt">{t("language")}</h1>

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
    </div>
  );
}
