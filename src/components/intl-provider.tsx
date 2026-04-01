"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import trMessages from "@/messages/tr.json";

const allMessages: Record<string, typeof enMessages> = {
  en: enMessages,
  tr: trMessages,
};

type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  isPending: boolean;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  isPending: false,
});

export function useLocaleContext() {
  return useContext(LocaleContext);
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState("en");
  const [isPending, startTransition] = useTransition();

  // On mount, restore persisted locale
  useEffect(() => {
    const stored = localStorage.getItem("app_locale");
    if (stored && stored in allMessages) {
      setLocaleState(stored);
    }
  }, []);

  // Keep <html lang> in sync
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: string) => {
    if (!(newLocale in allMessages)) return;
    localStorage.setItem("app_locale", newLocale);
    startTransition(() => {
      setLocaleState(newLocale);
    });
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isPending }}>
      <NextIntlClientProvider locale={locale} messages={allMessages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
