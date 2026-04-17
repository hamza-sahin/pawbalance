import { describe, expect, it } from "vitest";

import { calculateDER } from "../types";

describe("calculateDER", () => {
  it("matches the FEDIAF adult maintenance estimate for a moderately active adult dog", () => {
    expect(
      calculateDER({
        weightKg: 15,
        activityLevel: "MODERATE",
        ageMonths: 48,
      }),
    ).toBe(838);
  });

  it("reduces calories for low-activity adult dogs", () => {
    expect(
      calculateDER({
        weightKg: 15,
        activityLevel: "LOW",
        ageMonths: 48,
      }),
    ).toBe(724);
  });

  it("adjusts adult estimates for young adults and seniors", () => {
    expect(
      calculateDER({
        weightKg: 15,
        activityLevel: "MODERATE",
        ageMonths: 24,
      }),
    ).toBe(991);

    expect(
      calculateDER({
        weightKg: 15,
        activityLevel: "MODERATE",
        ageMonths: 96,
      }),
    ).toBe(724);
  });

  it("uses the official puppy equation when expected mature weight is available", () => {
    expect(
      calculateDER({
        weightKg: 10,
        activityLevel: "MODERATE",
        ageMonths: 6,
        expectedMatureWeightKg: 20,
      }),
    ).toBe(1049);
  });
});
