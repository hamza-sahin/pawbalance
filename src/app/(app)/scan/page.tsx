"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";

export default function ScanPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center p-4">
      <h1 className="mb-6 text-lg font-bold text-txt">{t("scanner")}</h1>

      <div className="flex w-full flex-col items-center gap-4 rounded-card border-2 border-dashed border-border bg-surface p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-card bg-primary/10">
          <Icons.scanner className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-txt">{t("scanFoodLabel")}</h2>
        <p className="text-sm text-txt-secondary">{t("pointCamera")}</p>
        <Button onClick={() => {}} aria-disabled="true">{t("openCamera")}</Button>
      </div>

      <div className="mt-6 flex w-full items-center gap-3 rounded-card bg-caution-bg/50 p-3">
        <Badge variant="premium">
          <Icons.crown className="mr-1 inline h-3 w-3" aria-hidden="true" />
          PRO
        </Badge>
        <div>
          <p className="text-sm font-medium text-txt">{t("premiumFeature")}</p>
          <p className="text-xs text-txt-secondary">{t("unlimitedScans")}</p>
        </div>
      </div>
    </div>
  );
}
