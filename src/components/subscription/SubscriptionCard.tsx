"use client";

import { useTranslations } from "next-intl";
import { Crown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { usePurchases } from "@/hooks/use-purchases";

interface SubscriptionCardProps {
  onUpgradeClick: () => void;
}

export function SubscriptionCard({ onUpgradeClick }: SubscriptionCardProps) {
  const t = useTranslations();
  const { subscriptionTier, subscriptionExpiry, isTrialing } = useAuthStore();
  const { manageSubscription, restore } = usePurchases();

  const isFree = subscriptionTier === "FREE";
  const tierLabel = subscriptionTier === "FREE"
    ? t("freePlan")
    : t("basicPlan");

  if (isFree) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className="w-full cursor-pointer text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80"
      >
        <Card className="flex items-center gap-3 p-4">
          <Crown className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
          <span className="flex-1 font-medium text-txt">{t("upgrade")}</span>
          <Badge variant="premium">PRO</Badge>
          <ChevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </button>
    );
  }

  const expiryDate = subscriptionExpiry
    ? new Date(subscriptionExpiry).toLocaleDateString()
    : null;

  return (
    <div className="flex flex-col gap-2">
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-txt">{tierLabel}</span>
          </div>
          <Badge>{t("currentPlan")}</Badge>
        </div>
        {isTrialing && expiryDate && (
          <p className="mb-1 text-xs text-caution">{t("trialEndsDate", { date: expiryDate })}</p>
        )}
        {!isTrialing && expiryDate && (
          <p className="text-xs text-txt-secondary">{t("nextRenewal", { date: expiryDate })}</p>
        )}
      </Card>
      <button
        onClick={manageSubscription}
        className="w-full cursor-pointer text-left transition-all duration-150 ease-out active:scale-95 active:opacity-80"
      >
        <Card className="flex items-center gap-3 p-4">
          <span className="flex-1 text-sm font-medium text-txt">{t("manageSubscription")}</span>
          <ChevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
        </Card>
      </button>
      <button
        onClick={restore}
        className="cursor-pointer text-center text-xs font-medium text-txt-secondary"
      >
        {t("restorePurchase")}
      </button>
    </div>
  );
}
