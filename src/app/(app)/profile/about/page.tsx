"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { getAppVersionLabel } from "@/lib/app-info";

export default function AboutPage() {
  const t = useTranslations();
  const router = useRouter();
  const version = getAppVersionLabel();

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("about")}</h1>
      </div>

      <div className="space-y-6 px-4 py-6">
        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutSummaryTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutSummaryBody")}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutMissionTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutMissionBody")}</p>
        </section>

        {version ? (
          <section>
            <h2 className="text-base font-semibold text-txt">{t("aboutVersionTitle")}</h2>
            <p className="mt-1.5 text-sm text-txt-secondary">{version}</p>
          </section>
        ) : null}

        <section>
          <h2 className="text-base font-semibold text-txt">{t("aboutOperatorTitle")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-txt-secondary">{t("aboutOperatorBody")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("aboutLegalTitle")}</h2>
          <div className="space-y-2">
            <Link href="/terms-of-service" className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
              <Card className="flex items-center gap-3 p-4">
                <Icons.fileText className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("termsOfService")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
            <Link href="/privacy-policy" className="block transition-all duration-150 ease-out active:scale-95 active:opacity-80">
              <Card className="flex items-center gap-3 p-4">
                <Icons.shield className="h-5 w-5 text-txt-secondary" aria-hidden="true" />
                <span className="flex-1 font-medium text-txt">{t("privacyPolicy")}</span>
                <Icons.chevronRight className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
