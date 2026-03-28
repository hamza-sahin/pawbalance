"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ScanPage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="mb-6 text-lg font-bold text-txt">{t("scanner")}</h1>

      <div className="flex w-full flex-col items-center gap-4 rounded-card border-2 border-dashed border-border bg-surface p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-card bg-primary/10 text-4xl text-primary">
          📄
        </div>
        <h2 className="text-lg font-semibold text-txt">{t("scanFoodLabel")}</h2>
        <p className="text-sm text-txt-secondary">{t("pointCamera")}</p>
        <Button onClick={() => {}}>{t("openCamera")}</Button>
      </div>

      <div className="mt-6 flex w-full items-center gap-3 rounded-card bg-caution-bg/50 p-3">
        <Badge variant="premium">⭐</Badge>
        <div>
          <p className="text-sm font-medium text-txt">{t("premiumFeature")}</p>
          <p className="text-xs text-txt-secondary">{t("unlimitedScans")}</p>
        </div>
      </div>
    </div>
  );
}
