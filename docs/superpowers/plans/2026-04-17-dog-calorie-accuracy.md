# Official Dog Calorie Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade PawBalance dog calorie guidance to use FEDIAF 2025 official formulas, collect the missing dog profile fields progressively, and clearly distinguish official, fallback, and unavailable calorie states.

**Architecture:** Move calorie logic out of `src/lib/types.ts` into a dedicated `src/lib/daily-calories.ts` helper that returns structured result metadata. Extend the pet profile schema with precise age and reproductive inputs, update the form progressively, then fan the new fields through persistence, AI pet-profile consumers, and the pet card UI.

**Tech Stack:** Next.js 15, TypeScript, Zod, Zustand, Vitest, next-intl, Supabase SQL

---

## File Structure

| File | Responsibility |
|------|---------------|
| `supabase/migrations/008_add_dog_calorie_profile_fields.sql` | Add nullable calorie-related pet columns and migrate old activity values |
| `src/lib/daily-calories.ts` | Dog-only official/fallback calorie engine |
| `src/lib/types.ts` | Shared enums and result types for new profile fields |
| `src/lib/validators.ts` | Conditional pet-form validation for puppy/reproductive inputs |
| `src/lib/pet-payload.ts` | Pure helper to normalize `PetFormValues` into DB/store-safe payloads |
| `src/lib/pet-profile-summary.ts` | Shared formatter for AI-facing pet summaries |
| `src/lib/constants.ts` | FEDIAF-aligned activity options metadata |
| `src/components/pet/pet-form.tsx` | Progressive profile fields and conditional clearing |
| `src/components/pet/activity-level-selector.tsx` | Updated FEDIAF activity labels and descriptions |
| `src/components/pet/pet-card.tsx` | Official/fallback/unavailable calorie display |
| `src/hooks/use-pets.ts` | Create/edit payload wiring |
| `src/store/pet-store.ts` | Guest-pet persistence for new fields |
| `src/lib/agent/tools/get-pet-profile.ts` | Include new pet fields in AI profile tool |
| `src/app/api/foods/ask/route.ts` | Include new pet fields in AI personalization prompt |
| `src/messages/en.json` | New UI copy for new fields and calorie state messaging |
| `src/messages/tr.json` | Turkish translations for the same copy |
| `src/lib/__tests__/daily-calories.test.ts` | Unit tests for adult, puppy, gestation, lactation, fallback, unavailable |
| `src/lib/__tests__/pet-form-schema.test.ts` | Conditional validation tests |
| `src/lib/__tests__/pet-payload.test.ts` | Pure mapping tests for persistence helper |
| `src/lib/__tests__/pet-profile-summary.test.ts` | Shared AI summary formatter tests |
| `src/components/pet/__tests__/pet-form.test.tsx` | Progressive form visibility and submit payload tests |
| `src/components/pet/__tests__/pet-card.test.tsx` | Official/fallback/unavailable display tests |

---

### Task 1: Add Supabase Migration For New Pet Fields

**Files:**
- Create: `supabase/migrations/008_add_dog_calorie_profile_fields.sql`

- [ ] **Step 1: Create the migration**

```sql
-- supabase/migrations/008_add_dog_calorie_profile_fields.sql
alter table public.pets
  add column if not exists birth_date date,
  add column if not exists expected_adult_weight_kg numeric,
  add column if not exists reproductive_state text not null default 'MAINTENANCE',
  add column if not exists gestation_week integer,
  add column if not exists lactation_week integer,
  add column if not exists litter_size integer;

update public.pets
set activity_level = case activity_level
  when 'LOW' then 'LOW'
  when 'MODERATE' then 'MODERATE_LOW_IMPACT'
  when 'HIGH' then 'MODERATE_HIGH_IMPACT'
  when 'WORKING' then 'HIGH_WORKING'
  else activity_level
end
where activity_level in ('LOW', 'MODERATE', 'HIGH', 'WORKING');

alter table public.pets
  add constraint pets_reproductive_state_check
  check (reproductive_state in ('MAINTENANCE', 'GESTATION', 'LACTATION'));

alter table public.pets
  add constraint pets_expected_adult_weight_positive_check
  check (
    expected_adult_weight_kg is null
    or expected_adult_weight_kg > 0
  );

alter table public.pets
  add constraint pets_gestation_week_check
  check (
    gestation_week is null
    or gestation_week between 1 and 9
  );

alter table public.pets
  add constraint pets_lactation_week_check
  check (
    lactation_week is null
    or lactation_week between 1 and 4
  );

alter table public.pets
  add constraint pets_litter_size_check
  check (
    litter_size is null
    or litter_size between 1 and 12
  );
```

- [ ] **Step 2: Sanity-check the migration file**

Run: `rg -n "birth_date|expected_adult_weight_kg|reproductive_state|MODERATE_LOW_IMPACT|HIGH_WORKING" supabase/migrations/008_add_dog_calorie_profile_fields.sql`

Expected: 5 matching lines showing new columns and activity remap entries

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_add_dog_calorie_profile_fields.sql
git commit -m "feat: add pet profile fields for official dog calorie guidance"
```

---

### Task 2: Add Failing Calorie Engine Tests And Implement `daily-calories.ts`

**Files:**
- Create: `src/lib/__tests__/daily-calories.test.ts`
- Create: `src/lib/daily-calories.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write the failing calorie engine tests**

```ts
// src/lib/__tests__/daily-calories.test.ts
import { describe, expect, it } from "vitest";
import { calculateDogDailyCalories } from "@/lib/daily-calories";

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

  it("returns the official lactation estimate and range metadata for high-working adults", () => {
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
      kcalRange: { min: 1419, max: 1654 },
    });

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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/__tests__/daily-calories.test.ts`

Expected: FAIL with module or export errors because `daily-calories.ts` does not exist yet

- [ ] **Step 3: Implement the shared types and calorie helper**

```ts
// src/lib/types.ts
export const ActivityLevel = z.enum([
  "LOW",
  "MODERATE_LOW_IMPACT",
  "MODERATE_HIGH_IMPACT",
  "HIGH_WORKING",
]);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const ReproductiveState = z.enum([
  "MAINTENANCE",
  "GESTATION",
  "LACTATION",
]);
export type ReproductiveState = z.infer<typeof ReproductiveState>;

export const PetSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  breed: z.string().nullable(),
  age_months: z.number().int().nullable(),
  birth_date: z.string().nullable(),
  weight_kg: z.number().nullable(),
  gender: PetGender.nullable(),
  is_neutered: z.boolean(),
  body_condition_score: z.number().int().min(1).max(9).nullable(),
  activity_level: ActivityLevel,
  expected_adult_weight_kg: z.number().nullable(),
  reproductive_state: ReproductiveState.default("MAINTENANCE"),
  gestation_week: z.number().int().nullable(),
  lactation_week: z.number().int().nullable(),
  litter_size: z.number().int().nullable(),
  known_allergies: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export interface DogDailyCaloriesInput {
  weightKg: number;
  activityLevel: ActivityLevel;
  ageMonths?: number | null;
  birthDate?: string | null;
  gender?: PetGender | null;
  isNeutered?: boolean;
  expectedAdultWeightKg?: number | null;
  reproductiveState?: ReproductiveState;
  gestationWeek?: number | null;
  lactationWeek?: number | null;
  litterSize?: number | null;
}

export type DailyCaloriesMode = "official" | "fallback" | "unavailable";

export interface DailyCaloriesResult {
  mode: DailyCaloriesMode;
  kcalPerDay: number | null;
  kcalRange: { min: number; max: number } | null;
  reason:
    | "adult_activity_table"
    | "puppy_growth_formula"
    | "missing_expected_adult_weight"
    | "under_eight_weeks"
    | "missing_gestation_week"
    | "missing_lactation_inputs";
  warnings: string[];
}
```

```ts
// src/lib/daily-calories.ts
import type { DailyCaloriesResult, DogDailyCaloriesInput } from "@/lib/types";

const LEGACY_FALLBACK_FACTORS = {
  LOW: 1.6,
  MODERATE_LOW_IMPACT: 1.8,
  MODERATE_HIGH_IMPACT: 2.0,
  HIGH_WORKING: 2.5,
} as const;

const ADULT_KCAL_PER_KG075 = {
  LOW: 95,
  MODERATE_LOW_IMPACT: 110,
  MODERATE_HIGH_IMPACT: 125,
} as const;

function metabolicWeight(weightKg: number) {
  return Math.pow(weightKg, 0.75);
}

function ageInWeeks(input: DogDailyCaloriesInput, today: Date): number | null {
  if (input.birthDate) {
    const birth = new Date(`${input.birthDate}T00:00:00.000Z`);
    return Math.floor((today.getTime() - birth.getTime()) / (7 * 24 * 60 * 60 * 1000));
  }
  if (input.ageMonths != null) return Math.round(input.ageMonths * 4.345);
  return null;
}

export function calculateDogDailyCalories(
  input: DogDailyCaloriesInput,
  today = new Date(),
): DailyCaloriesResult {
  const kg075 = metabolicWeight(input.weightKg);
  const weeks = ageInWeeks(input, today);
  const reproductiveState = input.reproductiveState ?? "MAINTENANCE";

  if (reproductiveState === "GESTATION") {
    if (!input.gestationWeek) {
      return { mode: "unavailable", kcalPerDay: null, kcalRange: null, reason: "missing_gestation_week", warnings: [] };
    }
    const kcalPerDay =
      input.gestationWeek <= 4
        ? Math.round(132 * kg075)
        : Math.round(132 * kg075 + 26 * input.weightKg);
    return { mode: "official", kcalPerDay, kcalRange: null, reason: "adult_activity_table", warnings: [] };
  }

  if (reproductiveState === "LACTATION") {
    if (!input.lactationWeek || !input.litterSize) {
      return { mode: "unavailable", kcalPerDay: null, kcalRange: null, reason: "missing_lactation_inputs", warnings: [] };
    }
    const weekFactor = { 1: 0.75, 2: 0.95, 3: 1.1, 4: 1.2 }[input.lactationWeek];
    const kcalPerDay =
      input.litterSize <= 4
        ? Math.round(145 * kg075 + 24 * input.litterSize * input.weightKg * weekFactor)
        : Math.round(145 * kg075 + (96 + 12 * (input.litterSize - 4)) * input.weightKg * weekFactor);
    return { mode: "official", kcalPerDay, kcalRange: null, reason: "adult_activity_table", warnings: [] };
  }

  if (weeks != null && weeks < 8) {
    return { mode: "unavailable", kcalPerDay: null, kcalRange: null, reason: "under_eight_weeks", warnings: [] };
  }

  if (weeks != null && weeks < 52) {
    if (input.expectedAdultWeightKg) {
      const kcalPerDay = Math.round(
        (254.1 - 135 * (input.weightKg / input.expectedAdultWeightKg)) * kg075,
      );
      return { mode: "official", kcalPerDay, kcalRange: null, reason: "puppy_growth_formula", warnings: [] };
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/__tests__/daily-calories.test.ts`

Expected: PASS with 5 passing tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/daily-calories.ts src/lib/__tests__/daily-calories.test.ts
git commit -m "feat: add official dog calorie engine"
```

---

### Task 3: Add Conditional Pet-Form Validation

**Files:**
- Create: `src/lib/__tests__/pet-form-schema.test.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/tr.json`

- [ ] **Step 1: Write the failing validator tests**

```ts
// src/lib/__tests__/pet-form-schema.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/__tests__/pet-form-schema.test.ts`

Expected: FAIL because the schema does not yet know about the new fields or conditions

- [ ] **Step 3: Implement the schema, activity options, and translations**

```ts
// src/lib/validators.ts
import { z } from "zod";
import { ReproductiveState } from "@/lib/types";

export const petFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
    breed: z.string().max(100).nullable(),
    age_months: z.coerce.number().int().min(0).max(360).nullable(),
    birth_date: z.string().nullable(),
    weight_kg: z.coerce.number().min(0.5, "Min 0.5 kg").max(100, "Max 100 kg").nullable(),
    gender: z.enum(["MALE", "FEMALE"]).nullable(),
    is_neutered: z.boolean().default(false),
    body_condition_score: z.coerce.number().int().min(1).max(9).nullable(),
    activity_level: z
      .enum([
        "LOW",
        "MODERATE_LOW_IMPACT",
        "MODERATE_HIGH_IMPACT",
        "HIGH_WORKING",
      ])
      .default("MODERATE_LOW_IMPACT"),
    expected_adult_weight_kg: z.coerce.number().min(0.5).max(120).nullable(),
    reproductive_state: ReproductiveState.default("MAINTENANCE"),
    gestation_week: z.coerce.number().int().min(1).max(9).nullable(),
    lactation_week: z.coerce.number().int().min(1).max(4).nullable(),
    litter_size: z.coerce.number().int().min(1).max(12).nullable(),
  })
  .superRefine((values, ctx) => {
    if (
      values.expected_adult_weight_kg != null &&
      values.weight_kg != null &&
      values.expected_adult_weight_kg <= values.weight_kg
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_adult_weight_kg"],
        message: "Expected adult weight must be greater than current weight",
      });
    }

    if (values.reproductive_state === "GESTATION" && values.gestation_week == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gestation_week"],
        message: "Gestation week is required",
      });
    }

    if (values.reproductive_state === "LACTATION") {
      if (values.lactation_week == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lactation_week"],
          message: "Lactation week is required",
        });
      }
      if (values.litter_size == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["litter_size"],
          message: "Litter size is required",
        });
      }
    }
  });
```

```ts
// src/lib/constants.ts
export interface ActivityLevelInfo {
  key: string;
  labelKey: string;
  descriptionKey: string;
}

export const ACTIVITY_LEVELS: ActivityLevelInfo[] = [
  { key: "LOW", labelKey: "activityLow", descriptionKey: "activityLowDesc" },
  {
    key: "MODERATE_LOW_IMPACT",
    labelKey: "activityModerateLowImpact",
    descriptionKey: "activityModerateLowImpactDesc",
  },
  {
    key: "MODERATE_HIGH_IMPACT",
    labelKey: "activityModerateHighImpact",
    descriptionKey: "activityModerateHighImpactDesc",
  },
  {
    key: "HIGH_WORKING",
    labelKey: "activityHighWorking",
    descriptionKey: "activityHighWorkingDesc",
  },
];
```

```json
// src/messages/en.json
"petBirthDate": "Birth Date",
"expectedAdultWeight": "Expected Adult Weight",
"expectedAdultWeightHint": "Recommended for more accurate puppy calories.",
"reproductiveState": "Reproductive State",
"maintenance": "Maintenance",
"gestation": "Gestation",
"lactation": "Lactation",
"gestationWeek": "Gestation Week",
"lactationWeek": "Lactation Week",
"litterSize": "Litter Size",
"activityModerateLowImpact": "Moderate",
"activityModerateLowImpactDesc": "1–3 hours/day, normal walks and play",
"activityModerateHighImpact": "Moderate High Impact",
"activityModerateHighImpactDesc": "1–3 hours/day, running, agility, or intense play",
"activityHighWorking": "High Working",
"activityHighWorkingDesc": "3–6 hours/day, herding, working, or sustained training",
"dailyCaloriesOfficialHint": "Official FEDIAF estimate",
"dailyCaloriesFallbackHint": "Approximate estimate. Add expected adult weight for better puppy accuracy.",
"dailyCaloriesUnavailableHint": "Complete the missing profile fields to calculate official calories."
```

- [ ] **Step 4: Run the validator test to verify it passes**

Run: `npm test -- src/lib/__tests__/pet-form-schema.test.ts`

Expected: PASS with 4 passing tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators.ts src/lib/constants.ts src/messages/en.json src/messages/tr.json src/lib/__tests__/pet-form-schema.test.ts
git commit -m "feat: add conditional dog calorie profile validation"
```

---

### Task 4: Add Progressive Pet Form Tests And Implement Conditional UI

**Files:**
- Modify: `src/components/pet/__tests__/pet-form.test.tsx`
- Modify: `src/components/pet/pet-form.tsx`
- Modify: `src/components/pet/activity-level-selector.tsx`

- [ ] **Step 1: Expand the form test file with failing progressive-field tests**

```ts
// src/components/pet/__tests__/pet-form.test.tsx
it("shows expected adult weight for puppies and submits it", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PetForm onSubmit={onSubmit} />
    </NextIntlClientProvider>,
  );

  await user.type(screen.getByLabelText(/name/i), "Poppy");
  await user.type(screen.getByLabelText(/age/i), "8");
  await user.type(screen.getByLabelText(/weight/i), "10");

  expect(screen.getByLabelText(/expected adult weight/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/expected adult weight/i), "20");
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("radio", { name: /male/i }));
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("radio", { name: /^moderate$/i }));
  await user.click(screen.getByRole("button", { name: /get started/i }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      expected_adult_weight_kg: 20,
    }),
    undefined,
    undefined,
  );
});

it("shows reproduction fields only for intact females", async () => {
  const user = userEvent.setup();
  renderPetForm();

  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("radio", { name: /female/i }));
  await user.click(screen.getByRole("checkbox", { name: /neutered/i }));

  expect(screen.getByRole("radiogroup", { name: /reproductive state/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/pet/__tests__/pet-form.test.tsx`

Expected: FAIL because the new labels and fields are not rendered yet

- [ ] **Step 3: Implement the progressive fields and clearing rules**

```tsx
// src/components/pet/pet-form.tsx
const [birthDate, setBirthDate] = useState(pet?.birth_date ?? "");
const [expectedAdultWeightKg, setExpectedAdultWeightKg] = useState(
  pet?.expected_adult_weight_kg?.toString() ?? "",
);
const [reproductiveState, setReproductiveState] = useState(
  pet?.reproductive_state ?? "MAINTENANCE",
);
const [gestationWeek, setGestationWeek] = useState(pet?.gestation_week?.toString() ?? "");
const [lactationWeek, setLactationWeek] = useState(pet?.lactation_week?.toString() ?? "");
const [litterSize, setLitterSize] = useState(pet?.litter_size?.toString() ?? "");

const derivedAgeMonths =
  birthDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${birthDate}T00:00:00.000Z`).getTime()) /
            (30 * 24 * 60 * 60 * 1000),
        ),
      )
    : ageMonths
      ? Number(ageMonths)
      : null;

const isPuppy = derivedAgeMonths != null && derivedAgeMonths < 12;
const showReproductiveFields = gender === "FEMALE" && !isNeutered;

useEffect(() => {
  if (!showReproductiveFields) {
    setReproductiveState("MAINTENANCE");
    setGestationWeek("");
    setLactationWeek("");
    setLitterSize("");
  }
}, [showReproductiveFields]);

useEffect(() => {
  if (reproductiveState !== "GESTATION") setGestationWeek("");
  if (reproductiveState !== "LACTATION") {
    setLactationWeek("");
    setLitterSize("");
  }
}, [reproductiveState]);

const raw = {
  name,
  breed,
  age_months: ageMonths ? Number(ageMonths) : null,
  birth_date: birthDate || null,
  weight_kg: weightKg ? Number(weightKg) : null,
  gender,
  is_neutered: isNeutered,
  body_condition_score: bcs,
  activity_level: activityLevel,
  expected_adult_weight_kg: expectedAdultWeightKg ? Number(expectedAdultWeightKg) : null,
  reproductive_state: showReproductiveFields ? reproductiveState : "MAINTENANCE",
  gestation_week: gestationWeek ? Number(gestationWeek) : null,
  lactation_week: lactationWeek ? Number(lactationWeek) : null,
  litter_size: litterSize ? Number(litterSize) : null,
};
```

```tsx
// src/components/pet/pet-form.tsx (step 0 additions)
<Input
  label={t("petBirthDate")}
  type="date"
  value={birthDate}
  onChange={(e) => setBirthDate(e.target.value)}
  error={errors.birth_date}
/>

{isPuppy && (
  <>
    <Input
      label={t("expectedAdultWeight")}
      type="text"
      inputMode="decimal"
      value={expectedAdultWeightKg}
      onChange={(e) => setExpectedAdultWeightKg(e.target.value)}
      error={errors.expected_adult_weight_kg}
    />
    <p className="text-xs text-txt-secondary">{t("expectedAdultWeightHint")}</p>
  </>
)}
```

```tsx
// src/components/pet/pet-form.tsx (step 1 additions)
{showReproductiveFields && (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-txt-secondary">
        {t("reproductiveState")}
      </label>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("reproductiveState")}>
        {(["MAINTENANCE", "GESTATION", "LACTATION"] as const).map((state) => (
          <button
            key={state}
            type="button"
            role="radio"
            aria-checked={reproductiveState === state}
            onClick={() => setReproductiveState(state)}
            className="rounded-card border p-3 text-left"
          >
            {t(state.toLowerCase())}
          </button>
        ))}
      </div>
    </div>

    {reproductiveState === "GESTATION" && (
      <Input
        label={t("gestationWeek")}
        type="text"
        inputMode="numeric"
        value={gestationWeek}
        onChange={(e) => setGestationWeek(e.target.value)}
        error={errors.gestation_week}
      />
    )}

    {reproductiveState === "LACTATION" && (
      <>
        <Input
          label={t("lactationWeek")}
          type="text"
          inputMode="numeric"
          value={lactationWeek}
          onChange={(e) => setLactationWeek(e.target.value)}
          error={errors.lactation_week}
        />
        <Input
          label={t("litterSize")}
          type="text"
          inputMode="numeric"
          value={litterSize}
          onChange={(e) => setLitterSize(e.target.value)}
          error={errors.litter_size}
        />
      </>
    )}
  </div>
)}
```

```tsx
// src/components/pet/pet-form.tsx (step 2 stays global)
<>
  <ActivityLevelSelector value={activityLevel} onChange={setActivityLevel} />
  <BCSSlider value={bcs} onChange={setBcs} />
</>
```

```tsx
// src/components/pet/activity-level-selector.tsx
<p className="font-medium text-txt">{t(level.labelKey)}</p>
<p className="text-sm text-txt-secondary">{t(level.descriptionKey)}</p>
```

- [ ] **Step 4: Run the form tests to verify they pass**

Run: `npm test -- src/components/pet/__tests__/pet-form.test.tsx`

Expected: PASS with the original navigation guard test plus the new progressive-field tests

- [ ] **Step 5: Commit**

```bash
git add src/components/pet/pet-form.tsx src/components/pet/activity-level-selector.tsx src/components/pet/__tests__/pet-form.test.tsx
git commit -m "feat: add progressive dog calorie profile fields to pet form"
```

---

### Task 5: Add Pure Payload Mapping And Wire Pet Persistence

**Files:**
- Create: `src/lib/__tests__/pet-payload.test.ts`
- Create: `src/lib/pet-payload.ts`
- Modify: `src/store/pet-store.ts`
- Modify: `src/hooks/use-pets.ts`

- [ ] **Step 1: Write the failing payload helper tests**

```ts
// src/lib/__tests__/pet-payload.test.ts
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/__tests__/pet-payload.test.ts`

Expected: FAIL because `pet-payload.ts` does not exist yet

- [ ] **Step 3: Implement the helper and use it in both persistence layers**

```ts
// src/lib/pet-payload.ts
import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";

export function buildPetWriteInput(values: PetFormValues) {
  const showReproductiveFields =
    values.gender === "FEMALE" && !values.is_neutered;

  const reproductiveState = showReproductiveFields
    ? values.reproductive_state
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
```

```ts
// src/hooks/use-pets.ts
import { buildPetWriteInput } from "@/lib/pet-payload";

.insert({
  owner_id: user.id,
  ...buildPetWriteInput(values),
  known_allergies: null,
})

.update({
  ...buildPetWriteInput(values),
  ...(removePhoto ? { avatar_url: null } : {}),
})
```

```ts
// src/store/pet-store.ts
import { buildLocalPet } from "@/lib/pet-payload";

// delete the local buildLocalPet implementation in this file
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/__tests__/pet-payload.test.ts src/components/pet/__tests__/pet-form.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/pet-payload.ts src/lib/__tests__/pet-payload.test.ts src/store/pet-store.ts src/hooks/use-pets.ts
git commit -m "refactor: normalize dog calorie pet payload mapping"
```

---

### Task 6: Add Shared Pet Summary Formatter And Update AI Consumers

**Files:**
- Create: `src/lib/__tests__/pet-profile-summary.test.ts`
- Create: `src/lib/pet-profile-summary.ts`
- Modify: `src/lib/agent/tools/get-pet-profile.ts`
- Modify: `src/app/api/foods/ask/route.ts`

- [ ] **Step 1: Write the failing summary formatter test**

```ts
// src/lib/__tests__/pet-profile-summary.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/__tests__/pet-profile-summary.test.ts`

Expected: FAIL because the formatter does not exist yet

- [ ] **Step 3: Implement the formatter and reuse it**

```ts
// src/lib/pet-profile-summary.ts
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
```

```ts
// src/lib/agent/tools/get-pet-profile.ts
import { formatPetProfileSummary } from "@/lib/pet-profile-summary";

.select(`
  id,
  name,
  breed,
  age_months,
  birth_date,
  weight_kg,
  gender,
  is_neutered,
  body_condition_score,
  activity_level,
  expected_adult_weight_kg,
  reproductive_state,
  gestation_week,
  lactation_week,
  litter_size
`)

const summary = formatPetProfileSummary(pet);
```

```ts
// src/app/api/foods/ask/route.ts
import { formatPetProfileSummary } from "@/lib/pet-profile-summary";

.select(`
  id,
  name,
  breed,
  age_months,
  birth_date,
  weight_kg,
  gender,
  is_neutered,
  body_condition_score,
  activity_level,
  expected_adult_weight_kg,
  reproductive_state,
  gestation_week,
  lactation_week,
  litter_size
`)

const profiles = pets.map((p) =>
  [`- ${p.name} (ID: ${p.id})`, formatPetProfileSummary(p)].join("\n"),
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/__tests__/pet-profile-summary.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/pet-profile-summary.ts src/lib/__tests__/pet-profile-summary.test.ts src/lib/agent/tools/get-pet-profile.ts src/app/api/foods/ask/route.ts
git commit -m "feat: include official calorie profile fields in AI pet summaries"
```

---

### Task 7: Add Pet Card Tests And Implement Official/Fallback/Unavailable UI

**Files:**
- Create: `src/components/pet/__tests__/pet-card.test.tsx`
- Modify: `src/components/pet/pet-card.tsx`

- [ ] **Step 1: Write the failing pet card tests**

```tsx
// src/components/pet/__tests__/pet-card.test.tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import { PetCard } from "@/components/pet/pet-card";

describe("PetCard", () => {
  it("shows an official calorie hint for adult dogs", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PetCard
          pet={{
            id: "pet-1",
            owner_id: "user-1",
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
            reproductive_state: "MAINTENANCE",
            gestation_week: null,
            lactation_week: null,
            litter_size: null,
            known_allergies: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/official fediaf estimate/i)).toBeInTheDocument();
  });

  it("shows fallback guidance for puppies missing expected adult weight", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PetCard
          pet={{
            id: "pet-2",
            owner_id: "user-1",
            name: "Poppy",
            breed: "Mixed",
            age_months: 8,
            birth_date: null,
            weight_kg: 10,
            gender: "FEMALE",
            is_neutered: false,
            body_condition_score: 5,
            activity_level: "MODERATE_LOW_IMPACT",
            expected_adult_weight_kg: null,
            reproductive_state: "MAINTENANCE",
            gestation_week: null,
            lactation_week: null,
            litter_size: null,
            known_allergies: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/approximate estimate/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/pet/__tests__/pet-card.test.tsx`

Expected: FAIL because the pet card still renders a bare number only

- [ ] **Step 3: Implement structured calorie rendering**

```tsx
// src/components/pet/pet-card.tsx
import { calculateDogDailyCalories } from "@/lib/daily-calories";

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
```

```tsx
// src/components/pet/pet-card.tsx (render block)
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
```

- [ ] **Step 4: Run the pet card test to verify it passes**

Run: `npm test -- src/components/pet/__tests__/pet-card.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/pet/pet-card.tsx src/components/pet/__tests__/pet-card.test.tsx
git commit -m "feat: show official and fallback calorie states on pet card"
```

---

### Task 8: Full Verification And Graph Rebuild

**Files:**
- Modify: `graphify-out/GRAPH_REPORT.md`
- Modify: `graphify-out/graph.json`

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
npm test -- \
  src/lib/__tests__/daily-calories.test.ts \
  src/lib/__tests__/pet-form-schema.test.ts \
  src/lib/__tests__/pet-payload.test.ts \
  src/lib/__tests__/pet-profile-summary.test.ts \
  src/components/pet/__tests__/pet-form.test.tsx \
  src/components/pet/__tests__/pet-card.test.tsx
```

Expected: PASS with all targeted tests green

- [ ] **Step 2: Run a production build**

Run: `npm run build`

Expected: successful static build; existing unrelated `ENVIRONMENT_FALLBACK` logs may still appear, but build exit code must be `0`

- [ ] **Step 3: Rebuild graphify output**

Run: `./scripts/rebuild-graphify.sh`

Expected: `graph.json and GRAPH_REPORT.md updated in graphify-out`

- [ ] **Step 4: Review the final diff**

Run: `git status --short`

Expected: only the planned files are modified or added

- [ ] **Step 5: Commit the final verification state**

```bash
git add \
  supabase/migrations/008_add_dog_calorie_profile_fields.sql \
  src/lib/daily-calories.ts \
  src/lib/types.ts \
  src/lib/validators.ts \
  src/lib/pet-payload.ts \
  src/lib/pet-profile-summary.ts \
  src/lib/constants.ts \
  src/components/pet/pet-form.tsx \
  src/components/pet/activity-level-selector.tsx \
  src/components/pet/pet-card.tsx \
  src/hooks/use-pets.ts \
  src/store/pet-store.ts \
  src/lib/agent/tools/get-pet-profile.ts \
  src/app/api/foods/ask/route.ts \
  src/messages/en.json \
  src/messages/tr.json \
  src/lib/__tests__/daily-calories.test.ts \
  src/lib/__tests__/pet-form-schema.test.ts \
  src/lib/__tests__/pet-payload.test.ts \
  src/lib/__tests__/pet-profile-summary.test.ts \
  src/components/pet/__tests__/pet-form.test.tsx \
  src/components/pet/__tests__/pet-card.test.tsx \
  graphify-out/GRAPH_REPORT.md \
  graphify-out/graph.json
git commit -m "feat: support official dog calorie guidance"
```

---

## Self-Review

### Spec Coverage

- Official adult, puppy, gestation, and lactation formulas: covered in Tasks 2 and 7
- Progressive optional profile fields: covered in Tasks 3 and 4
- Persistence and AI consumer propagation: covered in Tasks 5 and 6
- Official/fallback/unavailable UI states: covered in Task 7
- Verification and graph rebuild: covered in Task 8

### Placeholder Scan

- No `TODO`, `TBD`, or “similar to previous task” shortcuts remain
- Every code-changing step includes explicit code
- Every verification step includes exact commands and expected results

### Type Consistency

- Activity enum values are consistent across migration, types, validator, constants, form, helper, and tests
- Reproductive field names match across schema, helper, store, hooks, and UI
- Calorie helper returns one consistent `DailyCaloriesResult` shape consumed by the pet card
