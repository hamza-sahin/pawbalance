"use client";

import { useLocaleContext } from "@/components/intl-provider";

export function useLocale() {
  return useLocaleContext();
}
