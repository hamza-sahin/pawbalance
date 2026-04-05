import { z } from "zod";

// ============================================================
// Enums
// ============================================================

export const SubscriptionTier = z.enum(["FREE", "BASIC", "PREMIUM"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

export const SafetyLevel = z.enum(["SAFE", "MODERATE", "TOXIC"]);
export type SafetyLevel = z.infer<typeof SafetyLevel>;

export const PetGender = z.enum(["MALE", "FEMALE"]);
export type PetGender = z.infer<typeof PetGender>;

export const ActivityLevel = z.enum(["LOW", "MODERATE", "HIGH", "WORKING"]);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const FoodRequestStatus = z.enum(["pending", "approved", "rejected"]);
export type FoodRequestStatus = z.infer<typeof FoodRequestStatus>;

// ============================================================
// Activity level factors (for DER calculation)
// ============================================================

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  LOW: 1.6,
  MODERATE: 1.8,
  HIGH: 2.0,
  WORKING: 2.5,
};

// ============================================================
// Models
// ============================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  subscriptionTier: SubscriptionTier.default("FREE"),
  subscriptionExpiry: z.string().datetime().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const PetSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  breed: z.string().nullable(),
  age_months: z.number().int().nullable(),
  weight_kg: z.number().nullable(),
  gender: PetGender.nullable(),
  is_neutered: z.boolean(),
  body_condition_score: z.number().int().min(1).max(9).nullable(),
  activity_level: ActivityLevel,
  known_allergies: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Pet = z.infer<typeof PetSchema>;

export const FoodSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  category_en: z.string(),
  category_tr: z.string(),
  safety_level: SafetyLevel,
  dangerous_parts_en: z.string().nullable(),
  dangerous_parts_tr: z.string().nullable(),
  preparation_en: z.string().nullable(),
  preparation_tr: z.string().nullable(),
  benefits_en: z.string().nullable(),
  benefits_tr: z.string().nullable(),
  warnings_en: z.string().nullable(),
  warnings_tr: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Food = z.infer<typeof FoodSchema>;

export const FoodCategorySchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_tr: z.string(),
  food_count: z.number().int(),
});
export type FoodCategory = z.infer<typeof FoodCategorySchema>;

export const FoodRequestSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  food_name: z.string(),
  status: FoodRequestStatus,
  created_at: z.string(),
});
export type FoodRequest = z.infer<typeof FoodRequestSchema>;

/* ── Recipes ─────────────────────────────────────── */

export interface Recipe {
  id: string;
  owner_id: string;
  pet_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  preparation: string;
  sort_order: number;
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredient[];
}

export type AnalysisSafety = "safe" | "moderate" | "toxic";

export interface AnalysisIngredient {
  name: string;
  safety_level: AnalysisSafety;
  preparation_ok: boolean;
  notes: string;
}

export interface RecipeEditAction {
  type: "recipe_edit";
  label: string;
  ingredient_id: string;
  new_name: string;
  new_preparation: string;
}

export type DetailCardIcon = "pill" | "heart" | "alert" | "lightbulb" | "shield";

export interface DetailCardAction {
  type: "detail_card";
  label: string;
  icon: DetailCardIcon;
  detail: string;
}

export type FollowUpAction = RecipeEditAction | DetailCardAction;

export interface AnalysisResult {
  overall_safety: AnalysisSafety;
  ingredients: AnalysisIngredient[];
  safety_alerts: string[];
  preparation_warnings: string[];
  benefits_summary: string[];
  suggestions: string[];
  follow_up_actions: FollowUpAction[];
}

export type AnalysisStatus = "pending" | "completed" | "failed";

export interface RecipeAnalysis {
  id: string;
  recipe_id: string;
  pet_id: string | null;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  model_used: string | null;
  created_at: string;
}

// ============================================================
// Blog
// ============================================================

export const BLOG_TAGS = [
  "nutrition",
  "dog",
  "cat",
  "health",
  "safety",
  "behavior",
  "diet",
] as const;
export type BlogTag = (typeof BLOG_TAGS)[number];

export const BlogPostSchema = z.object({
  id: z.string(),
  title_tr: z.string(),
  title_en: z.string(),
  excerpt_tr: z.string(),
  excerpt_en: z.string(),
  body_tr: z.string().optional(),
  body_en: z.string().optional(),
  featured_image_url: z.string().nullable(),
  tags: z.array(z.string()),
  published_at: z.string(),
  reading_time_min: z.number(),
  slug: z.string(),
  is_featured: z.boolean(),
  source_url: z.string().nullable(),
  created_at: z.string(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;

// ============================================================
// Helpers
// ============================================================

/** Daily Energy Requirement: 70 * weight^0.75 * activityFactor */
export function calculateDER(weightKg: number, activityLevel: ActivityLevel): number {
  return Math.round(70 * Math.pow(weightKg, 0.75) * ACTIVITY_FACTORS[activityLevel]);
}

/** Get localised field from a Food row */
export function localise<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: string,
): string {
  const key = `${field}_${locale === "tr" ? "tr" : "en"}` as keyof T;
  return (row[key] as string) ?? "";
}

/** Split bullet-delimited text into an array */
export function splitBullets(text: string | null): string[] {
  if (!text) return [];
  return text.split("•").map((s) => s.trim()).filter(Boolean);
}
