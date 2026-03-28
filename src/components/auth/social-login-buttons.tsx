"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isNative } from "@/lib/platform";

export function SocialLoginButtons() {
  const t = useTranslations();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by auth store
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch {
      // Error handled by auth store
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        fullWidth
        onClick={handleGoogle}
        isLoading={googleLoading}
      >
        {t("signInWithGoogle")}
      </Button>
      {isNative && (
        <Button
          variant="outline"
          fullWidth
          onClick={handleApple}
          isLoading={appleLoading}
        >
          {t("signInWithApple")}
        </Button>
      )}
    </div>
  );
}
