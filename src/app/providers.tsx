"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthListener } from "@/hooks/use-auth";
import { initOtaUpdates, setOnUpdateReady, reloadApp } from "@/lib/platform";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthListener();
  const t = useTranslations();
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    setOnUpdateReady(() => setUpdateReady(true));
    initOtaUpdates();
  }, []);

  return (
    <>
      {children}
      {updateReady && (
        <div className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-lg">
            <p className="flex-1 text-sm font-medium text-txt">
              {t("updateReady")}
            </p>
            <button
              onClick={() => reloadApp()}
              className="shrink-0 rounded-button bg-primary-btn px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out active:scale-95"
            >
              {t("updateNow")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
