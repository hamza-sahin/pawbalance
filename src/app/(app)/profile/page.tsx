"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";

export default function ProfilePage() {
  const t = useTranslations();
  const { displayName, avatarUrl, user, subscriptionTier, signOut } = useAuth();
  const { locale } = useLocale();

  const menuItems = [
    { href: "/profile/pets", icon: Icons.paw, label: t("pets") },
    { href: "/profile/language", icon: Icons.globe, label: t("language"), trailing: locale === "tr" ? "Türkçe" : "English" },
    { href: "/profile/scan-history", icon: Icons.history, label: t("scanHistory") },
    { href: "#", icon: Icons.crown, label: t("upgradeToPremium"), badge: <Badge variant="premium">PRO</Badge> },
    { href: "#", icon: Icons.help, label: t("helpAndSupport") },
    { href: "#", icon: Icons.info, label: t("about") },
  ];

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant active:scale-90 active:opacity-70" aria-label="Settings">
          <Icons.settings className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* User card */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-variant text-3xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icons.user className="h-8 w-8 text-txt-tertiary" aria-hidden="true" />
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
          <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
            <Card className="flex items-center gap-3 p-4">
              <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
              <span className="flex-1 font-medium text-txt">{item.label}</span>
              {item.trailing && (
                <span className="text-sm text-txt-secondary">{item.trailing}</span>
              )}
              {item.badge}
              <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
            </Card>
          </Link>
        ))}
      </div>

      <button
        onClick={signOut}
        className="mt-6 w-full rounded-button py-3 text-center font-medium text-error transition-all duration-150 ease-out hover:bg-error/5 active:scale-95 active:bg-error/10"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
