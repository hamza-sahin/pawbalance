"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/hooks/use-auth";
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterPage() {
  const t = useTranslations();
  const { signUpWithEmail } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateField(field: string, value: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (field === "email") {
        next.email = value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? t("emailInvalid") : "";
      }
      if (field === "password") {
        next.password = value && value.length < 6 ? t("passwordMinLength") : "";
      }
      if (field === "confirmPassword") {
        next.confirmPassword = value && value !== password ? t("passwordsNoMatch") : "";
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("signUpFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2">
        <img
          src="/icons/icon-512x512.png"
          alt="PawBalance"
          className="h-16 w-16 rounded-2xl"
        />
        <h1 className="text-2xl font-bold text-txt">{t("signUp")}</h1>
        <p className="text-sm text-txt-secondary">{t("appName")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("displayName")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          required
        />
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => validateField("email", email)}
          error={fieldErrors.email || undefined}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
        />
        <PasswordInput
          label={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => validateField("password", password)}
          error={fieldErrors.password || undefined}
          autoComplete="new-password"
          placeholder={t("passwordMinLength")}
          required
        />
        <PasswordInput
          label={t("confirmPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => validateField("confirmPassword", confirmPassword)}
          error={fieldErrors.confirmPassword || undefined}
          autoComplete="new-password"
          placeholder={t("confirmPasswordPlaceholder")}
          required
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" fullWidth isLoading={isLoading}>
          {t("signUp")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-txt-tertiary">{t("orContinueWith")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialLoginButtons />

      <p className="mt-6 min-h-[44px] flex items-center justify-center text-center text-sm text-txt-secondary">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </>
  );
}
