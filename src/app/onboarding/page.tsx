"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth-store";
import { usePets } from "@/hooks/use-pets";
import { AppScreen } from "@/components/navigation/app-screen";
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
    <AppScreen
      title={t("onboardingWelcome")}
      contentClassName="p-4"
      trailing={
        <button
          onClick={handleSkip}
          className="text-sm font-medium text-txt-secondary transition-colors duration-150 active:opacity-70 focus-visible:underline focus-visible:outline-none"
        >
          {t("skip")}
        </button>
      }
    >
      <div className="mb-6 flex flex-col items-center">
        <img
          src="/icons/icon-512x512.png"
          alt="PawBalance"
          className="mb-4 h-16 w-16 rounded-2xl"
        />
        <div className="flex w-full justify-center">
          <div className="max-w-sm text-center">
          <p className="mt-2 text-sm text-txt-secondary">
            {t("onboardingSubtitle")}
          </p>
        </div>
      </div>
      </div>

      <PetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </AppScreen>
  );
}
