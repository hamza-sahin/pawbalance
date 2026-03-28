"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-safe-bg text-3xl">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-txt">{t("checkYourEmail")}</h1>
        <p className="text-sm text-txt-secondary">{t("resetEmailSent")}</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-txt">{t("resetPassword")}</h1>
      <p className="mb-6 text-sm text-txt-secondary">{t("resetPasswordDesc")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" fullWidth isLoading={isLoading}>
          {t("sendResetLink")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-txt-secondary">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </>
  );
}
