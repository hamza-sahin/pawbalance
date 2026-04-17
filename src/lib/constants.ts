import type { IconName } from "@/components/ui/icon";
import type { ActivityLevel } from "@/lib/types";

// ============================================================
// Category Styles (icon + background color)
// ============================================================

export interface CategoryStyle {
  icon: IconName;
  bg: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Asian Fruit":          { icon: "citrus",     bg: "bg-[#FFF3E0]" },
  "Asian Herb":           { icon: "sprout",     bg: "bg-[#D1FAE5]" },
  "Asian Vegetable":      { icon: "carrot",     bg: "bg-[#FFF8E1]" },
  Spice:                  { icon: "flaskRound", bg: "bg-[#FDF2F8]" },
  Fish:                   { icon: "fish",       bg: "bg-[#E0F2FE]" },
  Seafood:                { icon: "fish",       bg: "bg-[#E0F2FE]" },
  Meat:                   { icon: "beef",       bg: "bg-[#FEE2E2]" },
  "Fermented Food":       { icon: "flaskRound", bg: "bg-[#FDF2F8]" },
  "Prepared Food & Sauce":{ icon: "chefHat",    bg: "bg-[#FFF8E1]" },
  Bone:                   { icon: "bone",       bg: "bg-[#F3E8FF]" },
  Nuts:                   { icon: "nut",        bg: "bg-[#FED7AA]" },
  Mushroom:               { icon: "cloud",      bg: "bg-[#F1F5F9]" },
  Fruit:                  { icon: "apple",      bg: "bg-[#DCFCE7]" },
  Organ:                  { icon: "heartPulse", bg: "bg-[#FCE7F3]" },
  Vegetable:              { icon: "salad",      bg: "bg-[#ECFCCB]" },
  Dairy:                  { icon: "milk",       bg: "bg-[#EDE9FE]" },
  "Medicinal Herb":       { icon: "leaf",       bg: "bg-[#D1FAE5]" },
  Grain:                  { icon: "wheat",      bg: "bg-[#FEF9C3]" },
  "Pseudo-grain":         { icon: "wheat",      bg: "bg-[#FEF9C3]" },
  Sweetener:              { icon: "flaskRound", bg: "bg-[#FEF3C7]" },
  Seed:                   { icon: "sprout",     bg: "bg-[#ECFCCB]" },
  "Tropical Product":     { icon: "citrus",     bg: "bg-[#FFF3E0]" },
  "Tropical Oil":         { icon: "leaf",       bg: "bg-[#FFF3E0]" },
  "Salt & Mineral":       { icon: "flaskRound", bg: "bg-[#F1F5F9]" },
  Egg:                    { icon: "egg",        bg: "bg-[#FEF3C7]" },
  "Poisonous Plant":      { icon: "skull",      bg: "bg-[#FEE2E2]" },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = { icon: "search", bg: "bg-primary/10" };

export function getCategoryStyle(categoryEn: string): CategoryStyle {
  return CATEGORY_STYLES[categoryEn] ?? DEFAULT_CATEGORY_STYLE;
}

// ============================================================
// BCS Data (Body Condition Score, 1-9)
// ============================================================

export interface BcsData {
  score: number;
  label: string;
  description: string;
}

export const BCS_DESCRIPTIONS: Record<number, BcsData> = {
  1: { score: 1, label: "Emaciated", description: "Ribs, spine, and hip bones clearly visible. No body fat. Severe muscle loss." },
  2: { score: 2, label: "Very Thin", description: "Ribs easily visible. Minimal fat covering. Obvious waist and abdominal tuck." },
  3: { score: 3, label: "Thin", description: "Ribs easily felt with minimal fat. Waist obvious when viewed from above." },
  4: { score: 4, label: "Underweight", description: "Ribs easily felt with slight fat covering. Visible waist when viewed from above." },
  5: { score: 5, label: "Ideal", description: "Ribs felt without excess fat covering. Waist visible behind ribs. Abdominal tuck present." },
  6: { score: 6, label: "Slightly Overweight", description: "Ribs felt with slight excess fat. Waist visible but not prominent. Slight abdominal tuck." },
  7: { score: 7, label: "Overweight", description: "Ribs difficult to feel under fat. Fat deposits visible. Waist barely visible or absent." },
  8: { score: 8, label: "Obese", description: "Ribs not felt under heavy fat covering. Heavy fat deposits over spine and tail base. No waist." },
  9: { score: 9, label: "Severely Obese", description: "Massive fat deposits. No waist or abdominal tuck. Difficulty walking or breathing." },
};

export function getBcsCategory(score: number): "underweight" | "healthy" | "overweight" {
  if (score <= 3) return "underweight";
  if (score <= 6) return "healthy";
  return "overweight";
}

// ============================================================
// Breed List
// ============================================================

export const DOG_BREEDS: string[] = [
  "Mixed",
  "Other",
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Cocker Spaniel",
  "American Eskimo Dog",
  "American Foxhound",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Australian Terrier",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Bearded Collie",
  "Bedlington Terrier",
  "Belgian Malinois",
  "Belgian Sheepdog",
  "Belgian Tervuren",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Black and Tan Coonhound",
  "Bloodhound",
  "Border Collie",
  "Border Terrier",
  "Borzoi",
  "Boston Terrier",
  "Bouvier des Flandres",
  "Boxer",
  "Briard",
  "Brittany",
  "Brussels Griffon",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Cairn Terrier",
  "Canaan Dog",
  "Cardigan Welsh Corgi",
  "Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever",
  "Chihuahua",
  "Chinese Crested",
  "Chinese Shar-Pei",
  "Chow Chow",
  "Clumber Spaniel",
  "Cocker Spaniel",
  "Collie",
  "Coonhound",
  "Corgi",
  "Coton de Tulear",
  "Curly-Coated Retriever",
  "Dachshund",
  "Dalmatian",
  "Dandie Dinmont Terrier",
  "Doberman Pinscher",
  "Dogo Argentino",
  "Dogue de Bordeaux",
  "English Bulldog",
  "English Cocker Spaniel",
  "English Foxhound",
  "English Setter",
  "English Springer Spaniel",
  "English Toy Spaniel",
  "Field Spaniel",
  "Finnish Spitz",
  "Flat-Coated Retriever",
  "Fox Terrier",
  "French Bulldog",
  "German Pinscher",
  "German Shepherd",
  "German Shorthaired Pointer",
  "German Wirehaired Pointer",
  "Giant Schnauzer",
  "Glen of Imaal Terrier",
  "Golden Retriever",
  "Gordon Setter",
  "Great Dane",
  "Great Pyrenees",
  "Greater Swiss Mountain Dog",
  "Greyhound",
  "Harrier",
  "Havanese",
  "Ibizan Hound",
  "Irish Setter",
  "Irish Terrier",
  "Irish Water Spaniel",
  "Irish Wolfhound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Japanese Chin",
  "Keeshond",
  "Kerry Blue Terrier",
  "Komondor",
  "Kuvasz",
  "Labrador Retriever",
  "Lakeland Terrier",
  "Leonberger",
  "Lhasa Apso",
  "Lowchen",
  "Maltese",
  "Manchester Terrier",
  "Mastiff",
  "Miniature Bull Terrier",
  "Miniature Pinscher",
  "Miniature Poodle",
  "Miniature Schnauzer",
  "Neapolitan Mastiff",
  "Newfoundland",
  "Norfolk Terrier",
  "Norwegian Elkhound",
  "Norwich Terrier",
  "Nova Scotia Duck Tolling Retriever",
  "Old English Sheepdog",
  "Otterhound",
  "Papillon",
  "Parson Russell Terrier",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Petit Basset Griffon Vendeen",
  "Pharaoh Hound",
  "Plott Hound",
  "Pointer",
  "Polish Lowland Sheepdog",
  "Pomeranian",
  "Poodle",
  "Portuguese Water Dog",
  "Pug",
  "Puli",
  "Rat Terrier",
  "Redbone Coonhound",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Saluki",
  "Samoyed",
  "Schipperke",
  "Scottish Deerhound",
  "Scottish Terrier",
  "Sealyham Terrier",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Silky Terrier",
  "Skye Terrier",
  "Smooth Fox Terrier",
  "Soft Coated Wheaten Terrier",
  "Spinone Italiano",
  "Staffordshire Bull Terrier",
  "Standard Poodle",
  "Standard Schnauzer",
  "Sussex Spaniel",
  "Swedish Vallhund",
  "Tibetan Mastiff",
  "Tibetan Spaniel",
  "Tibetan Terrier",
  "Toy Fox Terrier",
  "Toy Poodle",
  "Vizsla",
  "Weimaraner",
  "Welsh Springer Spaniel",
  "Welsh Terrier",
  "West Highland White Terrier",
  "Whippet",
  "Wire Fox Terrier",
  "Wirehaired Pointing Griffon",
  "Yorkshire Terrier",
];

// ============================================================
// Activity Level Display
// ============================================================

export interface ActivityLevelInfo {
  key: ActivityLevel;
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

// ============================================================
// Limits
// ============================================================

export const MAX_PETS = 5;
export const MAX_PET_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;

// ============================================================
// Terms & Privacy
// ============================================================

export const CURRENT_TERMS_VERSION = 1;

// ============================================================
// Nutrition Tips (shown during analysis progress)
// ============================================================

export const NUTRITION_TIPS: readonly string[] = Array.from(
  { length: 100 },
  (_, i) => `tip_${i}`,
);
