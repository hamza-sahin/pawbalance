# Official Dog Calorie Accuracy Design

**Date:** 2026-04-17
**Status:** Draft
**Scope:** Upgrade PawBalance dog calorie estimates to use FEDIAF 2025 official guidance with progressive profile fields and clear confidence handling

## Problem Statement

The current calorie estimate is not sufficiently accurate for real dog feeding guidance.

Current issues:

1. Adult dogs previously used a generic `70 * BW^0.75 * activityFactor` formula instead of FEDIAF maintenance guidance.
2. Puppy energy needs cannot be calculated accurately without expected adult weight and more precise age data.
3. Pregnancy and lactation are not represented in the pet profile, so official reproductive formulas cannot be applied.
4. The current profile flow does not collect enough data to distinguish between official calculation paths and fallback estimates.
5. The UI shows one calorie number without indicating when the result is official vs fallback.

Goal:

- Support the most accurate official FEDIAF 2025 dog calorie estimate possible from user-provided profile data.
- Keep onboarding light for typical adult dogs.
- Ask for additional fields only when they materially improve calculation accuracy.

Non-goals:

- Cat calorie support in this change
- Veterinary disease-specific calorie adjustments
- Breed-specific overrides beyond FEDIAF’s general guidance examples

## Source of Truth

Primary source:

- FEDIAF Nutritional Guidelines, Publication September 2025

Relevant sections:

- Table VII-6: dog MER by age
- Table VII-7: dog DER by activity
- Table VII-8a: puppy growth curves
- Table VII-8b: dog growth, gestation, and lactation energy equations

This feature should use official FEDIAF formulas where enough data exists. Where required inputs are missing, the product must clearly downgrade to a fallback estimate instead of pretending full precision.

## Recommended Approach

Use a progressive profile model.

- Keep the current pet profile simple for adult maintenance dogs.
- Add new optional fields needed for official puppy and reproduction calculations.
- Reveal extra inputs only when they apply.
- Distinguish between:
  - `official` estimate: enough data exists for the exact FEDIAF path
  - `fallback` estimate: result is approximate because key inputs are missing
  - `unavailable`: official formula applies but required inputs are absent and no safe fallback should be shown

This approach gives full official support for dogs without forcing all users through a heavy onboarding flow.

## Data Model

Add the following nullable fields to `pets`:

- `birth_date date`
- `expected_adult_weight_kg numeric`
- `reproductive_state text`
- `gestation_week integer`
- `lactation_week integer`
- `litter_size integer`

### Reproductive State Enum

Allowed values:

- `MAINTENANCE`
- `GESTATION`
- `LACTATION`

Default for existing and new pets:

- `MAINTENANCE`

### Existing Fields Kept

Retain current fields:

- `age_months`
- `weight_kg`
- `gender`
- `is_neutered`
- `body_condition_score`

Rationale:

- `age_months` is still useful for backward compatibility and fallback cases.
- `birth_date` is preferred for precise age when available.

### Activity Model

Replace the current coarse activity labels with FEDIAF-aligned maintenance buckets:

- `LOW`
- `MODERATE_LOW_IMPACT`
- `MODERATE_HIGH_IMPACT`
- `HIGH_WORKING`

Migration mapping for existing pets:

- current `LOW` -> `LOW`
- current `MODERATE` -> `MODERATE_LOW_IMPACT`
- current `HIGH` -> `MODERATE_HIGH_IMPACT`
- current `WORKING` -> `HIGH_WORKING`

This removes ambiguity between the two moderate FEDIAF rows and avoids inventing a hybrid mapping at runtime.

## Calculation Model

All formulas in this feature are dog-only.

### 1. Adult Maintenance Dogs

Use FEDIAF Table VII-7 as the primary official adult estimate because the app explicitly collects activity.

Use Table VII-6 as supporting age-band context, not as a custom mathematical modifier. This avoids creating a non-official hybrid formula.

Inputs:

- current body weight
- age
- activity level

Rules:

- Prefer exact age from `birth_date`
- Fall back to `age_months`
- Adults are dogs aged `>= 12 months`
- Map activity buckets directly to FEDIAF rows:
  - `LOW` -> `95 kcal/kg BW^0.75`
  - `MODERATE_LOW_IMPACT` -> `110 kcal/kg BW^0.75`
  - `MODERATE_HIGH_IMPACT` -> `125 kcal/kg BW^0.75`
  - `HIGH_WORKING` -> official range `150-175 kcal/kg BW^0.75`
- For `HIGH_WORKING`, return:
  - primary displayed estimate = midpoint of range
  - explanation text must include official range
- Age-band guidance from Table VII-6 should be shown in explanation text when useful for interpretation, but must not create a custom age adjustment formula

Output:

- official estimate when age and weight are known

### 2. Puppies

Official puppy calculation requires:

- current body weight
- age in weeks
- expected adult weight

Rules:

- Puppy range for official formula: `8 weeks to < 12 months`
- Prefer age derived from `birth_date`
- If `birth_date` is missing, derive age approximately from `age_months`
- Use FEDIAF Table VII-8a growth curve equations based on expected adult weight band
- Use FEDIAF Table VII-8b puppy energy requirement:
  - `[254.1 - 135.0 * (actual BW / expected adult BW)] * actual BW^0.75`

Behavior by data completeness:

- `birth_date` + `expected_adult_weight_kg` present: official estimate
- `expected_adult_weight_kg` missing: fallback estimate allowed, but must be labeled less accurate
- age `< 8 weeks`: calorie result should not claim official puppy guidance; use `unavailable` or explicit fallback wording

### 3. Gestation

Official gestation calculation requires:

- current body weight
- reproductive state = `GESTATION`
- gestation week

Use FEDIAF Table VII-8b:

- first 4 weeks: `132 * kg BW^0.75`
- last 5 weeks: `132 * kg BW^0.75 + 26 * kg BW`

Behavior:

- If `GESTATION` is selected without `gestation_week`, result is `unavailable`
- No fake estimate should be shown

### 4. Lactation

Official lactation calculation requires:

- current body weight
- reproductive state = `LACTATION`
- litter size
- lactation week

Use FEDIAF Table VII-8b:

- `1 to 4 puppies`: `145 * kg BW^0.75 + 24 * n * kg BW * L`
- `5 to 8 puppies`: `145 * kg BW^0.75 + [96 + 12(n-4)] * kg BW * L`

Week factor `L`:

- week 1: `0.75`
- week 2: `0.95`
- week 3: `1.1`
- week 4: `1.2`

Behavior:

- If `LACTATION` is selected without required litter inputs, result is `unavailable`
- No fake estimate should be shown

### 5. Confidence States

The calorie engine should return structured metadata, not only a number.

Proposed result shape:

```ts
type CalorieEstimateMode = "official" | "fallback" | "unavailable";

interface DailyCaloriesResult {
  mode: CalorieEstimateMode;
  kcalPerDay: number | null;
  kcalRange?: { min: number; max: number } | null;
  reason: string;
  warnings: string[];
}
```

Examples:

- adult dog with age and weight: `official`
- puppy missing expected adult weight: `fallback`
- gestating dog missing gestation week: `unavailable`

## Profile UX

Use progressive disclosure inside the existing pet form flow.

### Base Fields

Keep current base inputs:

- name
- breed
- age
- weight
- gender
- neutered status
- activity level
- body condition score

Add:

- `birth date` optional

### Conditional Fields

#### Puppy-Specific

Show when pet is under 12 months by `birth_date` or `age_months`:

- `expected adult weight (kg)` optional but recommended

Copy:

- “Recommended for more accurate puppy calorie guidance.”

#### Reproductive Fields

Show only when:

- gender is `FEMALE`
- `is_neutered` is `false`

Then show:

- breeding state selector:
  - maintenance
  - gestation
  - lactation

If `GESTATION`:

- show `gestation week`

If `LACTATION`:

- show `lactation week`
- show `litter size`

### Validation Rules

- `expected_adult_weight_kg` optional overall
- if present, must be greater than current puppy weight
- `gestation_week` required only when `reproductive_state = GESTATION`
- `lactation_week` and `litter_size` required only when `reproductive_state = LACTATION`
- reproductive fields hidden and cleared when they no longer apply

### Activity Selector UX

Update activity choices to align with official FEDIAF maintenance rows:

- Low: under 1 hour/day, mostly lead walking
- Moderate low impact: 1 to 3 hours/day, normal walks and play
- Moderate high impact: 1 to 3 hours/day, intense running, fetch, agility
- High working: 3 to 6 hours/day, herding, working, sustained training

For `HIGH_WORKING`, the UI should communicate that the official guidance is a range rather than a single fixed point.

## UI Presentation

### Pet Card

Continue showing daily calories on the pet card, but add context state.

Display rules:

- official: show calorie number normally
- fallback: show calorie number plus info hint
- unavailable: replace calorie number with guidance prompt

Examples:

- Official: `838 kcal/day`
- Fallback: `~1040 kcal/day` plus “More accurate with expected adult weight”
- Unavailable: “Add gestation week to calculate official calories”

### Explanation Surface

Add a small explanatory hint or info affordance near calories.

It should explain:

- what inputs were used
- whether the result is official or fallback
- what extra field would improve accuracy if applicable
- when relevant, the official range behind the displayed estimate

## Data Flow Changes

Update these layers:

1. Supabase schema
2. `Pet` type and validators
3. pet store guest persistence
4. `usePets` create/edit logic
5. pet form UI
6. calorie calculator helper
7. pet card rendering
8. AI pet profile fetch tool output

AI profile tools should include the new fields so downstream nutrition features can reason from the same source of truth.

## Backward Compatibility

Existing pets must continue to work.

Rules:

- Existing rows get nullable new fields
- Existing `activity_level` values are mapped to new FEDIAF-aligned values
- Existing calorie rendering continues for adult dogs even when no new fields are present
- `age_months` remains supported
- `birth_date` takes precedence when both exist

No migration should require immediate user action for existing adult dogs.

## Implementation Notes

### Database

Create additive migration only.

Because this repo does not contain the original `pets` table creation migration, the new migration must only alter the existing table by adding nullable columns and safe defaults.

### Calculation Isolation

Move calorie logic behind a dedicated helper that can:

- determine life stage
- determine required inputs for official path
- return structured result metadata

Do not keep calorie rules embedded in UI components.

### Clearing Hidden State

When profile inputs change:

- switching from female intact to male or neutered should clear reproduction fields
- switching from lactation to maintenance should clear litter-specific fields

This avoids stale hidden data affecting calorie results.

## Testing Strategy

TDD required.

### Unit Tests

Add focused tests for:

- adult official estimate
- adult official range exposure for high-working dogs
- puppy official estimate with expected adult weight
- puppy fallback estimate when expected adult weight missing
- gestation official estimate
- lactation official estimate
- unavailable state when reproductive inputs are incomplete
- age precedence: `birth_date` over `age_months`

### Validator Tests

Add tests for:

- conditional required fields
- invalid expected adult weight
- hidden-state clearing behavior where applicable

### Component Tests

Pet form tests should cover:

- puppy fields appear only for puppies
- reproduction fields appear only for intact females
- gestation and lactation sub-fields toggle correctly
- submit payload includes new fields

### Verification

Before completion:

- run targeted tests
- run full relevant test subset
- run `npm run build`
- run `./scripts/rebuild-graphify.sh`

## Risks

1. Over-collecting inputs can hurt onboarding completion.
2. Hidden stale reproductive data can lead to wrong calorie results if not cleared.
3. Approximate age from `age_months` can still reduce puppy accuracy compared with `birth_date`.
4. Users may interpret a fallback estimate as fully official unless the UI labels it clearly.

## Success Criteria

- Adult maintenance dogs use FEDIAF-aligned official calculations.
- Puppies can use the official FEDIAF growth path when expected adult weight is provided.
- Gestation and lactation dogs can use official formulas when required fields are present.
- The app clearly distinguishes official, fallback, and unavailable states.
- Existing pets continue to render and save without migration breakage.
