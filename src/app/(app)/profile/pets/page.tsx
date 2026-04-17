"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePets } from "@/hooks/use-pets";
import { AppScreen } from "@/components/navigation/app-screen";
import { PetCard } from "@/components/pet/pet-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export default function PetsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { pets, canAddMore, deletePet } = usePets();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePet(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppScreen
      title={t("pets")}
      showBack
      backHref="/profile"
      withBottomNavSpacing
      contentClassName="p-4"
      trailing={canAddMore ? (
        <Link
          href="/onboarding"
          aria-label={t("addPet")}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl text-primary transition-opacity duration-150 active:opacity-50"
        >
          +
        </Link>
      ) : undefined}
    >
      {pets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">🐾</span>
          <p className="font-medium text-txt-secondary">{t("noPetsYet")}</p>
          <p className="text-sm text-txt-tertiary">{t("addFirstPet")}</p>
          <Button onClick={() => router.push("/onboarding")}>
            {t("addPet")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={() => router.push(`/profile/pets/edit?id=${pet.id}`)}
              onDelete={() => setDeleteTarget({ id: pet.id, name: pet.name })}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("deletePet")}
      >
        <p className="mb-4 text-sm text-txt-secondary">
          {deleteTarget && t("deletePetConfirm", { petName: deleteTarget.name })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="!bg-error hover:!bg-error/90"
          >
            {t("deletePet")}
          </Button>
        </div>
      </Dialog>
    </AppScreen>
  );
}
