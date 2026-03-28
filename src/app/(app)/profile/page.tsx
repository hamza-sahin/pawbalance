"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const t = useTranslations();
  const { displayName, avatarUrl, user, subscriptionTier, signOut } = useAuth();
  const { locale } = useLocale();

  const menuItems = [
    { href: "/profile/pets", icon: "🐾", label: t("pets") },
    {
      href: "/profile/language",
      icon: "🌐",
      label: t("language"),
      trailing: locale === "tr" ? "Türkçe" : "English",
    },
    { href: "/profile/scan-history", icon: "🕒", label: t("scanHistory") },
    {
      href: "#",
      icon: "⭐",
      label: t("upgradeToPremium"),
      badge: <Badge variant="premium">PRO</Badge>,
    },
    { href: "#", icon: "❓", label: t("helpAndSupport") },
    { href: "#", icon: "ℹ️", label: t("about") },
  ];

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
        <button className="text-xl text-txt-secondary">⚙️</button>
      </div>

      {/* User card */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-variant text-3xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <p className="text-lg font-bold text-txt">{displayName}</p>
        <p className="text-sm text-txt-secondary">{user?.email}</p>
        <Badge>
          {subscriptionTier === "PREMIUM" ? t("premiumPlan") : t("freePlan")}
        </Badge>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="flex items-center gap-3 p-4">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 font-medium text-txt">{item.label}</span>
              {item.trailing && (
                <span className="text-sm text-txt-secondary">{item.trailing}</span>
              )}
              {item.badge}
              <span className="text-txt-tertiary">›</span>
            </Card>
          </Link>
        ))}
      </div>

      <button
        onClick={signOut}
        className="mt-6 w-full rounded-button py-3 text-center font-medium text-error hover:bg-error/5"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
