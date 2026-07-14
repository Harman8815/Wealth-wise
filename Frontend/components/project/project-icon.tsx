import {
  Wallet,
  Briefcase,
  Home,
  Users,
  PiggyBank,
  Plane,
  Heart,
  GraduationCap,
  ShoppingCart,
  LineChart,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

// Maps the backend Project.ICON_CHOICES keys to Lucide icons.
const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  briefcase: Briefcase,
  home: Home,
  users: Users,
  "piggy-bank": PiggyBank,
  plane: Plane,
  heart: Heart,
  "graduation-cap": GraduationCap,
  "shopping-cart": ShoppingCart,
  "chart-line": LineChart,
};

export const PROJECT_ICON_OPTIONS = [
  { value: "wallet", label: "Wallet" },
  { value: "briefcase", label: "Work" },
  { value: "home", label: "Home" },
  { value: "users", label: "Team" },
  { value: "piggy-bank", label: "Savings" },
  { value: "plane", label: "Travel" },
  { value: "heart", label: "Health" },
  { value: "graduation-cap", label: "Education" },
  { value: "shopping-cart", label: "Shopping" },
  { value: "chart-line", label: "Investments" },
];

export function ProjectIcon({ icon, className }: { icon?: string; className?: string }) {
  const Cmp = ICON_MAP[icon ?? ""] ?? FolderKanban;
  return <Cmp className={className} />;
}
