"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { isIOSNative } from "@/lib/platform";
import { Icons } from "@/components/ui/icon";

type AppScreenProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  trailing?: React.ReactNode;
  withBottomNavSpacing?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
};

export function AppScreen({
  title,
  showBack = false,
  onBack,
  backHref,
  trailing,
  withBottomNavSpacing = false,
  contentClassName = "",
  children,
}: AppScreenProps) {
  const router = useRouter();
  const t = useTranslations();
  const chromeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const chromeElement = chromeRef.current;
    if (!chromeElement) return;

    chromeElement.classList.toggle("ios-screen-chrome", isIOSNative);

    return () => {
      chromeElement.classList.remove("ios-screen-chrome");
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backHref) {
      router.push(backHref);
      return;
    }

    router.back();
  };

  const trailingNode = trailing ?? <div className="h-11 w-11 shrink-0" aria-hidden="true" />;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <div
        ref={chromeRef}
        data-testid="app-screen-chrome"
        className="screen-chrome"
      >
        <div className="screen-header-row">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label={t("back")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors"
            >
              <Icons.arrowLeft className="h-5 w-5 text-txt" />
            </button>
          ) : (
            <div className="h-11 w-11 shrink-0" aria-hidden="true" />
          )}
          <h1 className="flex-1 text-center text-lg font-bold text-txt">{title}</h1>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">{trailingNode}</div>
        </div>
      </div>
      <div
        data-testid="app-screen-content"
        className={`min-h-0 flex-1 overflow-y-auto ${withBottomNavSpacing ? "screen-body-with-tabbar" : ""} ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
