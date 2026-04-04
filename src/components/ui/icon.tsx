import {
  Apple,
  ArrowLeft,
  Beef,
  Bone,
  Cake,
  Camera,
  Carrot,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  Citrus,
  Clock,
  Cloud,
  CookingPot,
  Crown,
  Dumbbell,
  Egg,
  Eye,
  EyeOff,
  FileText,
  Fish,
  Flame,
  FlaskRound,
  Globe,
  GraduationCap,
  Heart,
  HeartPulse,
  HelpCircle,
  History,
  Info,
  Layers,
  Leaf,
  Lock,
  Mail,
  Milk,
  Nut,
  PawPrint,
  Pencil,
  Plus,
  Salad,
  Scale,
  Search,
  SearchX,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Skull,
  Sprout,
  Trash2,
  TriangleAlert,
  User,
  UtensilsCrossed,
  Wheat,
  X,
} from "lucide-react";

export const Icons = {
  // Navigation
  arrowLeft: ArrowLeft,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  search: Search,
  close: X,
  clock: Clock,

  // Safety
  safe: ShieldCheck,
  caution: TriangleAlert,
  toxic: CircleX,

  // Food detail sections
  dangerousParts: CircleAlert,
  preparation: CookingPot,
  warnings: TriangleAlert,
  benefits: Heart,

  // Pet stats
  paw: PawPrint,
  age: Cake,
  weight: Scale,
  activity: Dumbbell,
  calories: Flame,

  // Pet actions
  edit: Pencil,
  delete: Trash2,
  camera: Camera,

  // Profile menu
  globe: Globe,
  history: History,
  crown: Crown,
  help: HelpCircle,
  info: Info,
  settings: Settings,
  user: User,

  // Documents
  fileText: FileText,
  shield: Shield,

  // Tabs
  scanner: FileText,
  bowl: UtensilsCrossed,
  learn: GraduationCap,

  // Auth
  mail: Mail,
  check: Check,
  eye: Eye,
  eyeOff: EyeOff,

  // Misc
  skull: Skull,

  // Category icons
  citrus: Citrus,
  carrot: Carrot,
  bone: Bone,
  milk: Milk,
  egg: Egg,
  flaskRound: FlaskRound,
  fish: Fish,
  apple: Apple,
  wheat: Wheat,
  beef: Beef,
  leaf: Leaf,
  cloud: Cloud,
  nut: Nut,
  heartPulse: HeartPulse,
  salad: Salad,
  sprout: Sprout,

  // Actions
  plus: Plus,
  share: Share2,
  searchX: SearchX,
  chefHat: ChefHat,
  layers: Layers,
  lock: Lock,
} as const;

export type IconName = keyof typeof Icons;
