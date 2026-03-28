"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePets } from "@/hooks/use-pets";
import { PetForm } from "@/components/pet/pet-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { PetFormValues } from "@/lib/validators";

export default function EditPetPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
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
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/profile/pets" className="text-txt-secondary hover:text-txt">
          ✕
        </Link>
        <h1 className="text-lg font-bold text-txt">
          {t("editPet")} {pet.name}
        </h1>
        <div />
      </div>

      <PetForm pet={pet} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
