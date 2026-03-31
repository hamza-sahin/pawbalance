// ============================================================
// Category Icons
// ============================================================

export const CATEGORY_ICONS: Record<string, string> = {
  "Asian Fruit": "🥭",
  "Asian Herb": "🌿",
  "Asian Vegetable": "🥬",
  Spice: "🌶️",
  Fish: "🐟",
  Seafood: "🦐",
  Meat: "🥩",
  "Fermented Food": "🫙",
  "Prepared Food & Sauce": "🍝",
  Bone: "🦴",
  Nuts: "🥜",
  Mushroom: "🍄",
  Fruit: "🍎",
  Organ: "🫀",
  Vegetable: "🥕",
  Dairy: "🧀",
  "Medicinal Herb": "🌱",
  Grain: "🌾",
  "Pseudo-grain": "🌾",
  Sweetener: "🍯",
  Seed: "🌻",
  "Tropical Product": "🥥",
  "Tropical Oil": "🫒",
  "Salt & Mineral": "🧂",
  Egg: "🥚",
  "Poisonous Plant": "☠️",
};

/** @deprecated Use Icon component directly. Kept during migration. */
export function getCategoryIcon(categoryEn: string): string {
  return CATEGORY_ICONS[categoryEn] ?? "🍽️";
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
  key: string;
  label: string;
  description: string;
  factor: number;
}

export const ACTIVITY_LEVELS: ActivityLevelInfo[] = [
  { key: "LOW", label: "Low", description: "Little to no exercise", factor: 1.6 },
  { key: "MODERATE", label: "Moderate", description: "Regular walks and play", factor: 1.8 },
  { key: "HIGH", label: "High", description: "Very active dog", factor: 2.0 },
  { key: "WORKING", label: "Working", description: "High activity or working dog", factor: 2.5 },
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
