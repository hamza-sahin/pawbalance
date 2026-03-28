"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const t = useTranslations();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-txt">{t("signIn")}</h1>
      <p className="mb-6 text-sm text-txt-secondary">{t("appName")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label={t("password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Button type="submit" fullWidth isLoading={isLoading}>
          {t("signIn")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-txt-tertiary">{t("orContinueWith")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialLoginButtons />

      <p className="mt-6 text-center text-sm text-txt-secondary">
        {t("dontHaveAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("signUp")}
        </Link>
      </p>
    </>
  );
}
