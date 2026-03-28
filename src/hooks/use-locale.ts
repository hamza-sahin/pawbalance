"use client";

import { useCallback, useTransition } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function useLocale() {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback(
    (newLocale: string) => {
      document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
      localStorage.setItem("app_locale", newLocale);
      startTransition(() => {
        router.refresh();
      });
    },
    [router],
  );

  return { locale, setLocale, isPending };
}
