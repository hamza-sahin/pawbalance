import { z } from "zod";
import { ActivityLevel, ReproductiveState } from "@/lib/types";

export const petFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
    breed: z.string().max(100).nullable(),
    age_months: z.coerce.number().int().min(0).max(360).nullable(),
    birth_date: z.string().nullable().default(null),
    weight_kg: z.coerce.number().min(0.5, "Min 0.5 kg").max(100, "Max 100 kg").nullable(),
    gender: z.enum(["MALE", "FEMALE"]).nullable(),
    is_neutered: z.boolean().default(false),
    body_condition_score: z.coerce.number().int().min(1).max(9).nullable(),
    activity_level: ActivityLevel.default("MODERATE_LOW_IMPACT"),
    expected_adult_weight_kg: z.coerce.number().min(0.5).max(120).nullable().default(null),
    reproductive_state: z.preprocess(
      (value) => value == null ? "MAINTENANCE" : value,
      ReproductiveState,
    ),
    gestation_week: z.coerce.number().int().min(1).max(9).nullable().default(null),
    lactation_week: z.coerce.number().int().min(1).max(4).nullable().default(null),
    litter_size: z.coerce.number().int().min(1).max(12).nullable().default(null),
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

export type PetFormValues = z.infer<typeof petFormSchema>;

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100),
  preparation: z.string().min(1, "Preparation method is required").max(100),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  pet_id: z.string().nullable(),
  ingredients: z
    .array(ingredientSchema)
    .min(1, "Add at least one ingredient"),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
