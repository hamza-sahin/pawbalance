import type { Pet } from "@/lib/types";

type PetProfileSummaryInput = Pick<
  Pet,
  | "id"
  | "name"
  | "breed"
  | "age_months"
  | "birth_date"
  | "weight_kg"
  | "gender"
  | "is_neutered"
  | "body_condition_score"
  | "activity_level"
  | "expected_adult_weight_kg"
  | "reproductive_state"
  | "gestation_week"
  | "lactation_week"
  | "litter_size"
>;

export function formatPetProfileSummary(pet: PetProfileSummaryInput): string {
  const lines = [
    `Dog: ${pet.name}`,
    `Breed: ${pet.breed ?? "unknown"}`,
    `Age: ${pet.age_months ?? "unknown"} months`,
    `Birth date: ${pet.birth_date ?? "unknown"}`,
    `Weight: ${pet.weight_kg ?? "unknown"} kg`,
    `Gender: ${pet.gender ?? "unknown"}, ${pet.is_neutered ? "neutered" : "intact"}`,
    `Body Condition Score: ${pet.body_condition_score ?? "unknown"}/9`,
    `Activity Level: ${pet.activity_level}`,
    `Expected adult weight: ${pet.expected_adult_weight_kg ?? "unknown"} kg`,
    `Reproductive state: ${pet.reproductive_state}`,
    `Gestation week: ${pet.gestation_week ?? "n/a"}`,
    `Lactation week: ${pet.lactation_week ?? "n/a"}`,
    `Litter size: ${pet.litter_size ?? "n/a"}`,
  ];
  return lines.join("\n");
}
