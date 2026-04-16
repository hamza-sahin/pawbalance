"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { buildSupportMailto, getSupportEmail } from "@/lib/support-mailto";

export default function SupportPage() {
  const t = useTranslations();
  const router = useRouter();
  const { locale } = useLocale();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
  const [showFallback, setShowFallback] = useState(false);

  function openMailto(href: string) {
    try {
      const result = window.open(href, "_self");
      if (result === null) {
        setShowFallback(true);
      }
    } catch {
      setShowFallback(true);
    }
  }

  function handleSubmit() {
    const nextErrors: { subject?: string; message?: string } = {};

    if (!subject.trim()) {
      nextErrors.subject = t("supportRequestSubjectRequired");
    }
    if (!message.trim()) {
      nextErrors.message = t("supportRequestMessageRequired");
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    openMailto(buildSupportMailto(subject.trim(), message.trim(), locale));
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-colors active:bg-border/50"
          aria-label={t("back")}
        >
          <Icons.arrowLeft className="h-5 w-5 text-txt" />
        </button>
        <h1 className="text-lg font-bold text-txt">{t("helpAndSupport")}</h1>
      </div>

      <div className="space-y-6 px-4 py-6">
        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportTitle")}</h2>
          <Card className="space-y-3 p-4">
            <p className="text-sm text-txt-secondary">{t("supportEmailLabel")}</p>
            <p className="font-medium text-txt">{getSupportEmail()}</p>
            <button
              type="button"
              onClick={() => openMailto(`mailto:${getSupportEmail()}`)}
              className="w-full cursor-pointer rounded-button bg-primary-btn py-3 text-sm font-medium text-white transition-opacity duration-150 active:opacity-80"
            >
              {t("supportEmailAction")}
            </button>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportRequestTitle")}</h2>
          <Card className="space-y-4 p-4">
            <label className="block text-sm font-medium text-txt">
              {t("supportRequestSubject")}
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-base text-txt outline-none transition-colors focus:border-primary"
              />
              {errors.subject ? (
                <span className="mt-1 block text-sm text-error" role="alert">
                  {errors.subject}
                </span>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-txt">
              {t("supportRequestMessage")}
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 min-h-32 w-full rounded-xl border border-border px-3 py-2 text-base text-txt outline-none transition-colors focus:border-primary"
              />
              {errors.message ? (
                <span className="mt-1 block text-sm text-error" role="alert">
                  {errors.message}
                </span>
              ) : null}
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full cursor-pointer rounded-button bg-primary-btn py-3 text-sm font-medium text-white transition-opacity duration-150 active:opacity-80"
            >
              {t("supportRequestSubmit")}
            </button>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-txt">{t("supportShortcutsTitle")}</h2>
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

        {showFallback ? (
          <p className="text-sm leading-relaxed text-txt-secondary">{t("supportMailFallback")}</p>
        ) : null}
      </div>
    </div>
  );
}
