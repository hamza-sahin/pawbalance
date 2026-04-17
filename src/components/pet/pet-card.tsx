import type { Pet } from "@/lib/types";
import { calculateDogDailyCalories } from "@/lib/daily-calories";
import { ACTIVITY_LEVELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icon";
import { useTranslations } from "next-intl";

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const t = useTranslations();
  const calories =
    pet.weight_kg != null
      ? calculateDogDailyCalories({
          weightKg: pet.weight_kg,
          activityLevel: pet.activity_level,
          ageMonths: pet.age_months,
          birthDate: pet.birth_date,
          gender: pet.gender,
          isNeutered: pet.is_neutered,
          expectedAdultWeightKg: pet.expected_adult_weight_kg,
          reproductiveState: pet.reproductive_state,
          gestationWeek: pet.gestation_week,
          lactationWeek: pet.lactation_week,
          litterSize: pet.litter_size,
        })
      : null;
  const activityLevelInfo = ACTIVITY_LEVELS.find((level) => level.key === pet.activity_level);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-variant">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              loading="lazy"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <Icons.paw className="h-6 w-6 text-txt-tertiary" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-txt">{pet.name}</p>
              {pet.breed && (
                <p className="text-sm text-txt-secondary">{pet.breed}</p>
              )}
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label={`${t("editPet")} ${pet.name}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-txt-secondary transition-all duration-150 ease-out hover:bg-surface-variant hover:text-txt active:scale-90 active:opacity-70 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icons.edit className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label={`${t("deletePet")} ${pet.name}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-error transition-all duration-150 ease-out hover:bg-error/5 active:scale-90 active:opacity-70 focus-visible:ring-2 focus-visible:ring-error"
                >
                  <Icons.delete className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pet.age_months != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            <Icons.age className="h-3 w-3" aria-hidden="true" /> {pet.age_months} {t("months")}
          </span>
        )}
        {pet.weight_kg != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            <Icons.weight className="h-3 w-3" aria-hidden="true" /> {pet.weight_kg} {t("kg")}
          </span>
        )}
        {pet.gender && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            {pet.gender === "MALE" ? "♂" : "♀"} {pet.is_neutered ? t("neutered") : t("intact")}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
          <Icons.activity className="h-3 w-3" aria-hidden="true" />{" "}
          {activityLevelInfo ? t(activityLevelInfo.labelKey) : pet.activity_level}
        </span>
      </div>
      {calories && (
        <div className="mt-3 rounded-button bg-primary-light/15 px-3 py-2 text-sm text-primary-dark">
          <div className="flex items-center gap-1.5">
            <Icons.calories className="h-4 w-4" aria-hidden="true" />
            <span>{t("dailyCalories")}:</span>
            <span className="font-semibold text-primary">
              {calories.kcalPerDay != null ? t("kcalPerDay", { kcal: calories.kcalPerDay }) : "—"}
            </span>
          </div>

          {calories.kcalRange && (
            <p className="mt-1 text-xs text-primary-dark/80">
              {calories.kcalRange.min}–{calories.kcalRange.max} kcal/day
            </p>
          )}

          <div className="mt-2 flex items-start gap-1.5 text-xs text-primary-dark/80">
            <Icons.info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {calories.mode === "official" && t("dailyCaloriesOfficialHint")}
              {calories.mode === "fallback" && t("dailyCaloriesFallbackHint")}
              {calories.mode === "unavailable" && t("dailyCaloriesUnavailableHint")}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
