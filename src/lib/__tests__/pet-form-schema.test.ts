import { describe, expect, it } from "vitest";
import { petFormSchema } from "@/lib/validators";

describe("petFormSchema", () => {
  const base = {
    name: "Milo",
    breed: "Beagle",
    age_months: 8,
    birth_date: null,
    weight_kg: 10,
    gender: "MALE",
    is_neutered: true,
    body_condition_score: 5,
    activity_level: "MODERATE_LOW_IMPACT",
    expected_adult_weight_kg: null,
    reproductive_state: "MAINTENANCE",
    gestation_week: null,
    lactation_week: null,
    litter_size: null,
  } as const;

  it("accepts a minimal legacy-style payload with new optional fields omitted", () => {
    const result = petFormSchema.safeParse({
      name: "Milo",
      breed: "Beagle",
      age_months: 8,
      weight_kg: 10,
      gender: "MALE",
      is_neutered: true,
      body_condition_score: 5,
      activity_level: "MODERATE_LOW_IMPACT",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birth_date).toBeNull();
      expect(result.data.expected_adult_weight_kg).toBeNull();
      expect(result.data.gestation_week).toBeNull();
      expect(result.data.lactation_week).toBeNull();
      expect(result.data.litter_size).toBeNull();
      expect(result.data.reproductive_state).toBe("MAINTENANCE");
    }
  });

  it("rejects expected adult weight lower than current puppy weight", () => {
    const result = petFormSchema.safeParse({
      ...base,
      expected_adult_weight_kg: 8,
    });
    expect(result.success).toBe(false);
  });

  it("requires gestation week when gestation is selected", () => {
    const result = petFormSchema.safeParse({
      ...base,
      gender: "FEMALE",
      is_neutered: false,
      reproductive_state: "GESTATION",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["gestation_week"],
        message: "Gestation week is required",
      }));
    }
  });

  it("requires lactation week and litter size when lactation is selected", () => {
    const result = petFormSchema.safeParse({
      ...base,
      gender: "FEMALE",
      is_neutered: false,
      reproductive_state: "LACTATION",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete lactation payload", () => {
    const result = petFormSchema.safeParse({
      ...base,
      gender: "FEMALE",
      is_neutered: false,
      reproductive_state: "LACTATION",
      lactation_week: 3,
      litter_size: 6,
    });
    expect(result.success).toBe(true);
  });
});
