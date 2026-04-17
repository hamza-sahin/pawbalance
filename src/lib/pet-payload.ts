import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";

const NEW_DOG_CALORIE_COLUMNS = [
  "birth_date",
  "expected_adult_weight_kg",
  "reproductive_state",
  "gestation_week",
  "lactation_week",
  "litter_size",
] as const;

export function buildPetWriteInput(values: PetFormValues) {
  const showReproductiveFields = values.gender === "FEMALE" && !values.is_neutered;

  const reproductiveState = showReproductiveFields
    ? values.reproductive_state ?? "MAINTENANCE"
    : "MAINTENANCE";

  return {
    name: values.name,
    breed: values.breed ?? null,
    age_months: values.age_months ?? null,
    birth_date: values.birth_date ?? null,
    weight_kg: values.weight_kg ?? null,
    gender: values.gender ?? null,
    is_neutered: values.is_neutered,
    body_condition_score: values.body_condition_score ?? null,
    activity_level: values.activity_level,
    expected_adult_weight_kg: values.expected_adult_weight_kg ?? null,
    reproductive_state: reproductiveState,
    gestation_week: reproductiveState === "GESTATION" ? values.gestation_week ?? null : null,
    lactation_week: reproductiveState === "LACTATION" ? values.lactation_week ?? null : null,
    litter_size: reproductiveState === "LACTATION" ? values.litter_size ?? null : null,
  };
}

export function buildLegacyPetWriteInput(values: PetFormValues) {
  return {
    name: values.name,
    breed: values.breed ?? null,
    age_months: values.age_months ?? null,
    weight_kg: values.weight_kg ?? null,
    gender: values.gender ?? null,
    is_neutered: values.is_neutered,
    body_condition_score: values.body_condition_score ?? null,
    activity_level: values.activity_level,
  };
}

export function shouldRetryPetWriteWithoutCalorieFields(
  error: { code?: string | null; message?: string | null; details?: string | null; hint?: string | null } | null | undefined,
): boolean {
  if (!error) return false;

  const haystack = [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return NEW_DOG_CALORIE_COLUMNS.some((column) => haystack.includes(column));
}

export function buildLocalPet(values: PetFormValues, photoDataUrl?: string | null): Pet {
  const now = new Date().toISOString();
  return {
    id: `local_${crypto.randomUUID()}`,
    owner_id: "guest",
    ...buildPetWriteInput(values),
    known_allergies: null,
    avatar_url: photoDataUrl ?? null,
    created_at: now,
    updated_at: now,
  };
}
