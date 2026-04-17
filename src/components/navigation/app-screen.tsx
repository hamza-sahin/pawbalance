"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppShellMode } from "@/lib/navigation";
import { Icons } from "@/components/ui/icon";

type AppScreenProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  trailing?: React.ReactNode;
  shellMode?: AppShellMode;
  showHeader?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
};

export function AppScreen({
  title,
  showBack = false,
  onBack,
  backHref,
  trailing,
  shellMode = "stacked",
  showHeader = true,
  contentClassName = "",
  children,
}: AppScreenProps) {
  const router = useRouter();
  const t = useTranslations();

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
    <div
      data-testid="app-screen"
      data-shell-mode={shellMode}
      data-has-header={showHeader ? "true" : "false"}
      className={`app-screen app-screen--${shellMode} flex min-h-full flex-1 flex-col bg-canvas`}
    >
      {showHeader ? (
        <div data-testid="app-screen-chrome" className="app-screen__chrome">
          <div className="app-screen__header-row">
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
            {title ? (
              <h1 className="flex-1 text-center text-lg font-bold text-txt">{title}</h1>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">{trailingNode}</div>
          </div>
        </div>
      ) : null}
      <div
        data-testid="app-screen-content"
        className={`app-screen__content min-h-0 flex-1 overflow-y-auto ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
