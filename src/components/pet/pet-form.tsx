"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Pet } from "@/lib/types";
import type { ActivityLevel } from "@/lib/types";
import { petFormSchema, type PetFormValues } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BreedSelector } from "./breed-selector";
import { ActivityLevelSelector } from "./activity-level-selector";
import { BCSSlider } from "./bcs-slider";
import { PhotoPicker } from "./photo-picker";

interface PetFormProps {
  pet?: Pet | null;
  onSubmit: (values: PetFormValues, photo?: string | null, removePhoto?: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function PetForm({ pet, onSubmit, isLoading }: PetFormProps) {
  const t = useTranslations();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [name, setName] = useState(pet?.name ?? "");
  const [breed, setBreed] = useState<string | null>(pet?.breed ?? null);
  const [ageMonths, setAgeMonths] = useState(pet?.age_months?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(pet?.weight_kg?.toString() ?? "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | null>(pet?.gender ?? null);
  const [isNeutered, setIsNeutered] = useState(pet?.is_neutered ?? false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    (pet?.activity_level as ActivityLevel) ?? "MODERATE",
  );
  const [bcs, setBcs] = useState(pet?.body_condition_score ?? 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const raw = {
      name,
      breed,
      age_months: ageMonths ? Number(ageMonths) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      gender,
      is_neutered: isNeutered,
      body_condition_score: bcs,
      activity_level: activityLevel,
    };

    const result = petFormSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(result.data, photoDataUrl, removePhoto);
  }

  const displayPhoto = removePhoto
    ? null
    : photoDataUrl ?? pet?.avatar_url ?? null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PhotoPicker
        currentUrl={displayPhoto}
        onPick={(url) => {
          setPhotoDataUrl(url);
          setRemovePhoto(false);
        }}
        onRemove={() => {
          setPhotoDataUrl(null);
          setRemovePhoto(true);
        }}
      />

      <Input
        label={`${t("petName")} *`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <BreedSelector value={breed} onChange={setBreed} />

      <Input
        label={t("petAge")}
        type="number"
        value={ageMonths}
        onChange={(e) => setAgeMonths(e.target.value)}
        placeholder="months"
        error={errors.age_months}
      />

      <Input
        label={`${t("petWeight")} *`}
        type="number"
        step="0.1"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
        placeholder="kg"
        error={errors.weight_kg}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-txt-secondary">
          {t("petGender")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["MALE", "FEMALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex items-center justify-center gap-2 rounded-card border p-3 text-sm font-medium transition-colors ${
                gender === g
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-txt hover:bg-surface-variant"
              }`}
            >
              {g === "MALE" ? "♂" : "♀"} {g === "MALE" ? t("male") : t("female")}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-txt">
        <input
          type="checkbox"
          checked={isNeutered}
          onChange={(e) => setIsNeutered(e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
        {t("neutered")}
      </label>

      <ActivityLevelSelector value={activityLevel} onChange={setActivityLevel} />

      <BCSSlider value={bcs} onChange={setBcs} />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {pet ? t("saveChanges") : t("getStarted")}
      </Button>
    </form>
  );
}
