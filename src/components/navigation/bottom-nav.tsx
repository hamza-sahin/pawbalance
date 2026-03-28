"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const tabs = [
  { key: "scanner", href: "/scan", label: "scanner" },
  { key: "bowl", href: "/bowl", label: "bowl" },
  { key: "search", href: "/search", label: "search" },
  { key: "learn", href: "/learn", label: "learn" },
  { key: "profile", href: "/profile", label: "profile" },
] as const;

const icons: Record<string, React.ReactNode> = {
  scanner: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  bowl: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M3 11l9-9 9 9M5 9v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9" />
    </svg>
  ),
  search: (
    <svg className="h-6 w-6" fill="none" stroke="white" strokeWidth={2.2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  learn: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map((tab) => {
          const isCenter = tab.key === "search";
          const isActive = pathname.startsWith(tab.href);

          if (isCenter) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_4px_12px_rgba(74,124,89,0.4)]"
              >
                {icons[tab.key]}
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
                isActive ? "text-primary" : "text-txt-tertiary"
              }`}
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
