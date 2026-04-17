"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePets } from "@/hooks/use-pets";
import { AppScreen } from "@/components/navigation/app-screen";
import { PetForm } from "@/components/pet/pet-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { PetFormValues } from "@/lib/validators";

export default function EditPetPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const { pets, editPet } = usePets();
  const [isLoading, setIsLoading] = useState(false);

  const pet = pets.find((p) => p.id === id);

  async function handleSubmit(
    values: PetFormValues,
    photo?: string | null,
    removePhoto?: boolean,
  ) {
    setIsLoading(true);
    try {
      await editPet(id, values, photo, removePhoto);
      router.push("/profile/pets");
    } finally {
      setIsLoading(false);
    }
  }

  if (!pet) {
    return (
      <AppScreen title={t("editPet")} showBack backHref="/profile/pets" contentClassName="p-4">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={`${t("editPet")} ${pet.name}`}
      showBack
      backHref="/profile/pets"
      contentClassName="p-4"
    >
      <PetForm pet={pet} onSubmit={handleSubmit} isLoading={isLoading} />
    </AppScreen>
  );
}
