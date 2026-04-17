import { describe, expect, it } from "vitest";
import { calculateDogDailyCalories } from "@/lib/daily-calories";
import { PetSchema } from "@/lib/types";

describe("calculateDogDailyCalories", () => {
  const asOfDate = new Date("2026-04-17T00:00:00.000Z");

  it("returns an official adult low-activity estimate", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 15,
          activityLevel: "LOW",
          ageMonths: 48,
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "official",
      kcalPerDay: 724,
    });
  });

  it("returns the official puppy equation when expected adult weight is present", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 10,
          activityLevel: "MODERATE_LOW_IMPACT",
          birthDate: "2025-10-10",
          expectedAdultWeightKg: 20,
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "official",
      kcalPerDay: 1049,
    });
  });

  it("falls back for puppies missing expected adult weight", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 10,
          activityLevel: "MODERATE_LOW_IMPACT",
          birthDate: "2025-10-10",
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "fallback",
      reason: "missing_expected_adult_weight",
    });
  });

  it("falls back when expected adult weight is not greater than current weight", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 10,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 8,
          expectedAdultWeightKg: 10,
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "fallback",
      reason: "missing_expected_adult_weight",
    });
  });

  it("returns unavailable when gestation week is missing", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 36,
          gender: "FEMALE",
          isNeutered: false,
          reproductiveState: "GESTATION",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "unavailable",
      kcalPerDay: null,
      reason: "missing_gestation_week",
    });
  });

  it("returns unavailable when gestation week is invalid", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 36,
          reproductiveState: "GESTATION",
          gestationWeek: 0,
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "unavailable",
      kcalPerDay: null,
      reason: "missing_gestation_week",
    });
  });

  it("guards puppies under 8 weeks as unavailable", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 5,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 1,
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "unavailable",
      kcalPerDay: null,
      reason: "under_eight_weeks",
    });
  });

  it("returns official high-working adult range metadata", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "HIGH_WORKING",
          ageMonths: 36,
          reproductiveState: "MAINTENANCE",
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "official",
      kcalPerDay: 1537,
      kcalRange: { min: 1419, max: 1655 },
    });
  });

  it("returns the official lactation estimate", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 36,
          gender: "FEMALE",
          isNeutered: false,
          reproductiveState: "LACTATION",
          lactationWeek: 3,
          litterSize: 6,
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "official",
      kcalPerDay: 4011,
    });
  });

  it("returns unavailable for invalid lactation inputs", () => {
    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 36,
          reproductiveState: "LACTATION",
          lactationWeek: 7,
          litterSize: 6,
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "unavailable",
      kcalPerDay: null,
      reason: "missing_lactation_inputs",
    });

    expect(
      calculateDogDailyCalories(
        {
          weightKg: 20,
          activityLevel: "MODERATE_LOW_IMPACT",
          ageMonths: 36,
          reproductiveState: "LACTATION",
          lactationWeek: 3,
          litterSize: 0,
        },
        asOfDate,
      ),
    ).toMatchObject({
      mode: "unavailable",
      kcalPerDay: null,
      reason: "missing_lactation_inputs",
    });
  });

  it("normalizes missing reproductive_state to MAINTENANCE", () => {
    const parsed = PetSchema.parse({
      id: "pet-1",
      owner_id: "owner-1",
      name: "Biscuit",
      breed: null,
      age_months: 24,
      weight_kg: 20,
      gender: "FEMALE",
      is_neutered: false,
      body_condition_score: 5,
      activity_level: "MODERATE_LOW_IMPACT",
      known_allergies: null,
      avatar_url: null,
      created_at: "2026-04-17T00:00:00.000Z",
      updated_at: "2026-04-17T00:00:00.000Z",
    });

    expect(parsed.reproductive_state).toBe("MAINTENANCE");
  });

  it("normalizes null reproductive_state to MAINTENANCE", () => {
    const parsed = PetSchema.parse({
      id: "pet-2",
      owner_id: "owner-1",
      name: "Biscuit",
      breed: null,
      age_months: 24,
      weight_kg: 20,
      gender: "FEMALE",
      is_neutered: false,
      body_condition_score: 5,
      activity_level: "MODERATE_LOW_IMPACT",
      reproductive_state: null,
      known_allergies: null,
      avatar_url: null,
      created_at: "2026-04-17T00:00:00.000Z",
      updated_at: "2026-04-17T00:00:00.000Z",
    });

    expect(parsed.reproductive_state).toBe("MAINTENANCE");
  });
});
