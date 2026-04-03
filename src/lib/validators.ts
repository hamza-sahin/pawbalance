import { z } from "zod";

export const petFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  breed: z.string().max(100).nullable(),
  age_months: z.coerce.number().int().min(0).max(360).nullable(),
  weight_kg: z.coerce.number().min(0.5, "Min 0.5 kg").max(100, "Max 100 kg").nullable(),
  gender: z.enum(["MALE", "FEMALE"]).nullable(),
  is_neutered: z.boolean().default(false),
  body_condition_score: z.coerce.number().int().min(1).max(9).nullable(),
  activity_level: z.enum(["LOW", "MODERATE", "HIGH", "WORKING"]).default("MODERATE"),
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
