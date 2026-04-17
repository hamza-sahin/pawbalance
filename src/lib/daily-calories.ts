import type { DailyCaloriesResult, DogDailyCaloriesInput } from "@/lib/types";

const LEGACY_FALLBACK_FACTORS = {
  LOW: 1.6,
  MODERATE_LOW_IMPACT: 1.8,
  MODERATE_HIGH_IMPACT: 2.0,
  HIGH_WORKING: 2.5,
} as const;

const LACTATION_WEEK_FACTORS: Record<1 | 2 | 3 | 4, number> = {
  1: 0.75,
  2: 0.95,
  3: 1.1,
  4: 1.2,
};

const ADULT_KCAL_PER_KG075 = {
  LOW: 95,
  MODERATE_LOW_IMPACT: 110,
  MODERATE_HIGH_IMPACT: 125,
} as const;

function parseBirthDate(dateText: string): Date | null {
  const normalized = dateText.trim();
  const withDefaultTime = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00.000Z`
    : normalized;
  const parsed = new Date(withDefaultTime);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function metabolicWeight(weightKg: number) {
  return Math.pow(weightKg, 0.75);
}

function ageInWeeks(input: DogDailyCaloriesInput, today: Date): number | null {
  if (input.birthDate) {
    const birth = parseBirthDate(input.birthDate);
    if (!birth) return null;
    return Math.floor((today.getTime() - birth.getTime()) / (7 * 24 * 60 * 60 * 1000));
  }
  if (input.ageMonths != null) return Math.round(input.ageMonths * 4.345);
  return null;
}

function isValidLactationWeek(week: number | null | undefined): week is 1 | 2 | 3 | 4 {
  return week !== null && week !== undefined && Number.isInteger(week) && week >= 1 && week <= 4;
}

function hasPositiveLitterSize(litterSize: number | null | undefined): litterSize is number {
  return litterSize !== null && litterSize !== undefined && Number.isInteger(litterSize) && litterSize > 0;
}

function isValidGestationWeek(week: number | null | undefined): boolean {
  return week !== null && week !== undefined && Number.isInteger(week) && week >= 1 && week <= 9;
}

export function calculateDogDailyCalories(
  input: DogDailyCaloriesInput,
  today = new Date(),
): DailyCaloriesResult {
  const kg075 = metabolicWeight(input.weightKg);
  const weeks = ageInWeeks(input, today);
  const reproductiveState = input.reproductiveState ?? "MAINTENANCE";

  if (reproductiveState === "GESTATION") {
    if (!isValidGestationWeek(input.gestationWeek)) {
      return {
        mode: "unavailable",
        kcalPerDay: null,
        kcalRange: null,
        reason: "missing_gestation_week",
        warnings: [],
      };
    }
    const kcalPerDay =
      input.gestationWeek <= 4
        ? Math.round(132 * kg075)
        : Math.round(132 * kg075 + 26 * input.weightKg);
    return {
      mode: "official",
      kcalPerDay,
      kcalRange: null,
      reason: "adult_activity_table",
      warnings: [],
    };
  }

  if (reproductiveState === "LACTATION") {
    const lactationWeek = input.lactationWeek;
    const litterSize = input.litterSize;
    if (!isValidLactationWeek(lactationWeek) || !hasPositiveLitterSize(litterSize)) {
      return {
        mode: "unavailable",
        kcalPerDay: null,
        kcalRange: null,
        reason: "missing_lactation_inputs",
        warnings: [],
      };
    }
    const weekFactor = LACTATION_WEEK_FACTORS[lactationWeek];
    const kcalPerDay =
      litterSize <= 4
        ? Math.round(145 * kg075 + 24 * litterSize * input.weightKg * weekFactor)
        : Math.round(
            145 * kg075 + (96 + 12 * (litterSize - 4)) * input.weightKg * weekFactor,
          );
    return {
      mode: "official",
      kcalPerDay,
      kcalRange: null,
      reason: "adult_activity_table",
      warnings: [],
    };
  }

  if (weeks != null && weeks < 8) {
    return {
      mode: "unavailable",
      kcalPerDay: null,
      kcalRange: null,
      reason: "under_eight_weeks",
      warnings: [],
    };
  }

  if (weeks != null && weeks < 52) {
    if (
      input.expectedAdultWeightKg != null &&
      input.expectedAdultWeightKg > input.weightKg
    ) {
      const kcalPerDay = Math.round(
        (254.1 - 135 * (input.weightKg / input.expectedAdultWeightKg)) * kg075,
      );
      return {
        mode: "official",
        kcalPerDay,
        kcalRange: null,
        reason: "puppy_growth_formula",
        warnings: [],
      };
    }
    const kcalPerDay = Math.round(70 * kg075 * LEGACY_FALLBACK_FACTORS[input.activityLevel]);
    return {
      mode: "fallback",
      kcalPerDay,
      kcalRange: null,
      reason: "missing_expected_adult_weight",
      warnings: ["expected_adult_weight_recommended"],
    };
  }

  if (input.activityLevel === "HIGH_WORKING") {
    return {
      mode: "official",
      kcalPerDay: Math.round(162.5 * kg075),
      kcalRange: {
        min: Math.round(150 * kg075),
        max: Math.round(175 * kg075),
      },
      reason: "adult_activity_table",
      warnings: [],
    };
  }

  return {
    mode: "official",
    kcalPerDay: Math.round(ADULT_KCAL_PER_KG075[input.activityLevel] * kg075),
    kcalRange: null,
    reason: "adult_activity_table",
    warnings: [],
  };
}
