import { describe, expect, it } from "vitest";
import { formatPetProfileSummary } from "@/lib/pet-profile-summary";

describe("formatPetProfileSummary", () => {
  it("includes new calorie-relevant fields", () => {
    expect(
      formatPetProfileSummary({
        id: "pet-1",
        name: "Maya",
        breed: "Border Collie",
        age_months: 8,
        birth_date: "2025-08-10",
        weight_kg: 10,
        gender: "FEMALE",
        is_neutered: false,
        body_condition_score: 5,
        activity_level: "MODERATE_HIGH_IMPACT",
        expected_adult_weight_kg: 20,
        reproductive_state: "MAINTENANCE",
        gestation_week: null,
        lactation_week: null,
        litter_size: null,
      }),
    ).toContain("Expected adult weight: 20 kg");
  });
});
