import { describe, expect, it } from "vitest";
import { buildPetWriteInput } from "@/lib/pet-payload";

describe("buildPetWriteInput", () => {
  it("clears reproductive fields for neutered pets", () => {
    expect(
      buildPetWriteInput({
        name: "Milo",
        breed: "Beagle",
        age_months: 24,
        birth_date: null,
        weight_kg: 12,
        gender: "MALE",
        is_neutered: true,
        body_condition_score: 5,
        activity_level: "MODERATE_LOW_IMPACT",
        expected_adult_weight_kg: null,
        reproductive_state: "LACTATION",
        gestation_week: null,
        lactation_week: 3,
        litter_size: 6,
      }),
    ).toMatchObject({
      reproductive_state: "MAINTENANCE",
      gestation_week: null,
      lactation_week: null,
      litter_size: null,
    });
  });

  it("defaults reproductive_state to MAINTENANCE when female intact payload lacks it", () => {
    expect(
      buildPetWriteInput({
        name: "Luna",
        breed: "Hound",
        age_months: 8,
        birth_date: null,
        weight_kg: 10,
        gender: "FEMALE",
        is_neutered: false,
        body_condition_score: 5,
        activity_level: "MODERATE_LOW_IMPACT",
        expected_adult_weight_kg: 15,
        reproductive_state: undefined as unknown as "MAINTENANCE",
        gestation_week: null,
        lactation_week: null,
        litter_size: null,
      } as unknown as Parameters<typeof buildPetWriteInput>[0]),
    ).toMatchObject({
      reproductive_state: "MAINTENANCE",
      gestation_week: null,
      lactation_week: null,
      litter_size: null,
    });
  });

  it("passes reproductive fields through for intact females", () => {
    expect(
      buildPetWriteInput({
        name: "Luna",
        breed: "Hound",
        age_months: 18,
        birth_date: null,
        weight_kg: 22,
        gender: "FEMALE",
        is_neutered: false,
        body_condition_score: 4,
        activity_level: "HIGH_WORKING",
        expected_adult_weight_kg: 28,
        reproductive_state: "LACTATION",
        gestation_week: null,
        lactation_week: 2,
        litter_size: 7,
      }),
    ).toMatchObject({
      reproductive_state: "LACTATION",
      gestation_week: null,
      lactation_week: 2,
      litter_size: 7,
    });
  });
});
