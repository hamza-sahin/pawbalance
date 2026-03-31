"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { PetForm } from "@/components/pet/pet-form";
import type { PetFormValues } from "@/lib/validators";

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuthStore();
  const { createPet, saveGuestPet } = usePets();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    values: PetFormValues,
    photo?: string | null,
  ) {
    setIsLoading(true);
    try {
      if (session) {
        await createPet(values, photo);
      } else {
        saveGuestPet(values, photo);
      }
      router.replace("/search");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    localStorage.setItem("onboarding_completed", "true");
    router.replace("/search");
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas p-4">
      <div className="mb-6 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="PawBalance"
          className="mb-4 h-12 w-auto"
        />
        <div className="flex w-full items-start justify-between">
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-txt">{t("onboardingWelcome")}</h1>
          <p className="mt-2 text-sm text-txt-secondary">
            {t("onboardingSubtitle")}
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="shrink-0 ml-2 mt-1 text-sm font-medium text-txt-secondary transition-colors duration-150 active:opacity-70 focus-visible:underline focus-visible:outline-none"
        >
          {t("skip")}
        </button>
      </div>
      </div>

      <PetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
