"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface SubscriptionBannerProps {
  onSubscribeClick: () => void;
  onManageClick: () => void;
}

export function SubscriptionBanner({ onSubscribeClick, onManageClick }: SubscriptionBannerProps) {
  const t = useTranslations();
  const { isTrialing, subscriptionExpiry, hasBillingIssue } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Billing issue banner
  if (hasBillingIssue) {
    return (
      <div className="flex items-center gap-2 rounded-card bg-toxic/10 px-4 py-2.5">
        <p className="flex-1 text-xs font-medium text-toxic">
          {t("billingIssue")}{" "}
          <button onClick={onManageClick} className="cursor-pointer font-semibold underline">
            {t("updatePayment")}
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-toxic/60"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Trial expiry banner
  if (!isTrialing || !subscriptionExpiry) return null;

  const expiryDate = new Date(subscriptionExpiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 2) return null;

  const message = daysLeft <= 0
    ? t("trialEndsToday")
    : t("trialEndsIn", { days: String(daysLeft) });

  return (
    <div className="flex items-center gap-2 rounded-card bg-[#FFF8E1] px-4 py-2.5">
      <p className="flex-1 text-xs font-medium text-caution">
        {message}{" "}
        <button onClick={onSubscribeClick} className="cursor-pointer font-semibold underline">
          {t("subscribe")}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-caution/60"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
