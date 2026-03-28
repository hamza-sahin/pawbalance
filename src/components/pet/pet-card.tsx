import type { Pet } from "@/lib/types";
import { calculateDER, type ActivityLevel } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface PetCardProps {
  pet: Pet;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const t = useTranslations();
  const der =
    pet.weight_kg != null
      ? calculateDER(pet.weight_kg, pet.activity_level as ActivityLevel)
      : null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-variant text-2xl">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            "🐾"
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
            <div className="flex gap-2">
              {onEdit && (
                <button onClick={onEdit} className="text-txt-secondary hover:text-txt">
                  ✏️
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="text-error hover:text-error/80">
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pet.age_months != null && (
          <span className="rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            🎂 {pet.age_months} months
          </span>
        )}
        {pet.weight_kg != null && (
          <span className="rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            ⚖️ {pet.weight_kg} kg
          </span>
        )}
        {pet.gender && (
          <span className="rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
            {pet.gender === "MALE" ? "♂" : "♀"} {pet.is_neutered ? t("neutered") : "Intact"}
          </span>
        )}
        <span className="rounded-full bg-surface-variant px-2.5 py-1 text-xs text-txt-secondary">
          ⚡ {pet.activity_level}
        </span>
      </div>
      {der != null && (
        <div className="mt-3 flex items-center gap-1.5 rounded-button bg-primary-light/15 px-3 py-2 text-sm text-primary-dark">
          🏠 Daily Calories: <span className="font-semibold text-primary">{t("kcalPerDay", { kcal: der })}</span>
        </div>
      )}
    </Card>
  );
}
