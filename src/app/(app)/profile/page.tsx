"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { usePets } from "@/hooks/use-pets";
import { useLocale } from "@/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { LoginSheet } from "@/components/auth/LoginSheet";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { PaywallSheet } from "@/components/subscription/PaywallSheet";

export default function ProfilePage() {
  const t = useTranslations();
  const { displayName, avatarUrl, user, subscriptionTier, signOut, isAuthenticated } = useAuth();
  const { selectedPet } = usePets();
  const { locale } = useLocale();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Guest view
  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-txt">{t("profile")}</h1>
        </div>

        {/* Guest pet card */}
        {selectedPet && (
          <Card className="mb-4 flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface-variant">
              {selectedPet.avatar_url ? (
                <img src={selectedPet.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icons.paw className="h-5 w-5 text-txt-tertiary" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-txt">{selectedPet.name}</p>
              {selectedPet.breed && (
                <p className="text-sm text-txt-secondary">{selectedPet.breed}</p>
              )}
            </div>
          </Card>
        )}

        {/* Sign in CTA card */}
        <button
          type="button"
          className="mb-4 w-full cursor-pointer rounded-card border border-border bg-surface p-4 text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setShowLoginSheet(true)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icons.user className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-txt">{t("guestSignInCard")}</p>
              <p className="mt-0.5 text-sm text-txt-secondary">{t("guestSignInCardDesc")}</p>
            </div>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </div>
        </button>

        {/* Language selector */}
        <Link href="/profile/language" className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
          <Card className="flex items-center gap-3 p-4">
            <Icons.globe className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
            <span className="flex-1 font-medium text-txt">{t("language")}</span>
            <span className="text-sm text-txt-secondary">{locale === "tr" ? "Türkçe" : "English"}</span>
            <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
          </Card>
        </Link>

        {showLoginSheet && (
          <LoginSheet onDismiss={() => setShowLoginSheet(false)} />
        )}
      </div>
    );
  }

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
          {subscriptionTier === "FREE" ? t("freePlan") : t("basicPlan")}
        </Badge>
      </div>

      {/* Menu - grouped */}
      <div className="flex flex-col gap-5">
        {/* My Account */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("myAccount")}</p>
          <div className="flex flex-col gap-2">
            {[
              { href: "/profile/pets", icon: Icons.paw, label: t("pets") },
              { href: "/profile/language", icon: Icons.globe, label: t("language"), trailing: locale === "tr" ? "Türkçe" : "English" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
                <Card className="flex items-center gap-3 p-4">
                  <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                  <span className="flex-1 font-medium text-txt">{item.label}</span>
                  {item.trailing && <span className="text-sm text-txt-secondary">{item.trailing}</span>}
                  <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("subscription")}</p>
          <SubscriptionCard onUpgradeClick={() => setShowPaywall(true)} />
        </div>

        {/* Support */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-txt-tertiary">{t("support")}</p>
          <div className="flex flex-col gap-2">
            {[
              { href: "#", icon: Icons.help, label: t("helpAndSupport") },
              { href: "#", icon: Icons.info, label: t("about") },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
                <Card className="flex items-center gap-3 p-4">
                  <item.icon className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                  <span className="flex-1 font-medium text-txt">{item.label}</span>
                  <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sign out with confirmation */}
      <button
        onClick={() => setShowSignOutDialog(true)}
        className="mt-6 w-full rounded-button py-3 text-center font-medium text-error transition-all duration-150 ease-out hover:bg-error/5 active:scale-95 active:bg-error/10"
      >
        {t("signOut")}
      </button>

      {showPaywall && (
        <PaywallSheet requiredTier="basic" onDismiss={() => setShowPaywall(false)} />
      )}

      <Dialog open={showSignOutDialog} onClose={() => setShowSignOutDialog(false)} title={t("signOutTitle")}>
        <p className="mb-4 text-sm text-txt-secondary">{t("signOutConfirm")}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSignOutDialog(false)}
            className="flex-1 rounded-button border border-border py-2.5 text-sm font-medium text-txt transition-all duration-150 ease-out active:scale-95"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => { setShowSignOutDialog(false); signOut(); }}
            className="flex-1 rounded-button bg-error py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-95"
          >
            {t("signOut")}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
