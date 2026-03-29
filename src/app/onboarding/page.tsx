"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePets } from "@/hooks/use-pets";
import { PetForm } from "@/components/pet/pet-form";
import type { PetFormValues } from "@/lib/validators";

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const { createPet } = usePets();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    values: PetFormValues,
    photo?: string | null,
  ) {
    setIsLoading(true);
    try {
      await createPet(values, photo);
      router.replace("/search");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="safe-top mx-auto min-h-screen max-w-md bg-canvas p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-txt">{t("onboardingWelcome")}</h1>
        <p className="mt-2 text-sm text-txt-secondary">
          {t("onboardingSubtitle")}
        </p>
      </div>

      <PetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
