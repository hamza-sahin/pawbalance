"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UtensilsCrossed } from "lucide-react";

const tabs = [
  { key: "recipes", href: "/recipes", label: "recipes" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;

const icons: Record<string, React.ReactNode> = {
  recipes: <UtensilsCrossed className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />,
  search: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  learn: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-md md:max-w-lg lg:max-w-2xl items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map((tab) => {
          const isCenter = tab.key === "search";
          const isActive = pathname.startsWith(tab.href);

          if (isCenter) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-label={t(tab.label)}
                aria-current={isActive ? "page" : undefined}
                className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-btn text-white shadow-[0_4px_12px_rgba(74,124,89,0.3)] transition-all duration-150 ease-out active:scale-90 active:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {icons[tab.key]}
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px] transition-all duration-150 ease-out ${
                isActive ? "font-medium text-primary" : "text-txt-tertiary"
              } active:bg-surface-variant active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
            >
              {icons[tab.key]}
              <span>{t(tab.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
