import {
  ArrowLeft,
  Cake,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CircleX,
  CookingPot,
  Crown,
  Dumbbell,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  History,
  Info,
  Mail,
  PawPrint,
  Pencil,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Skull,
  Trash2,
  TriangleAlert,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";

export const Icons = {
  // Navigation
  arrowLeft: ArrowLeft,
  chevronRight: ChevronRight,
  search: Search,
  close: X,

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
} as const;

export type IconName = keyof typeof Icons;
