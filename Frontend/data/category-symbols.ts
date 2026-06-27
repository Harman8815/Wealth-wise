/**
 * Shared category symbol, color, and text color constants.
 * Safe to import from both server and client components — contains no JSX or client-only imports.
 */

export const CATEGORY_SYMBOLS = [
  { value: "utensils", label: "Utensils" },
  { value: "car", label: "Car" },
  { value: "shopping-cart", label: "Shopping Cart" },
  { value: "film", label: "Film" },
  { value: "home", label: "Home" },
  { value: "heart-pulse", label: "Healthcare" },
  { value: "fuel", label: "Fuel" },
  { value: "wifi", label: "Internet" },
  { value: "phone", label: "Phone" },
  { value: "credit-card", label: "Credit Card" },
  { value: "gift", label: "Gift" },
  { value: "coffee", label: "Coffee" },
  { value: "book", label: "Education" },
  { value: "plane", label: "Travel" },
  { value: "dumbbell", label: "Fitness" },
  { value: "music", label: "Music" },
  { value: "shirt", label: "Shopping" },
  { value: "zap", label: "Utilities" },
  { value: "piggy-bank", label: "Savings" },
  { value: "briefcase", label: "Work" },
] as const

export type CategorySymbol = (typeof CATEGORY_SYMBOLS)[number]["value"]

export const COLOR_OPTIONS = [
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#ef4444",
  "#22c55e",
  "#6b7280",
] as const

export type ColorOption = (typeof COLOR_OPTIONS)[number]

export const TEXT_COLOR_OPTIONS = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#1f2937", label: "Gray 800" },
  { value: "#4b5563", label: "Gray 600" },
  { value: "#9ca3af", label: "Gray 400" },
  { value: "#fef3c7", label: "Amber 100" },
  { value: "#fecaca", label: "Red 200" },
  { value: "#bbf7d0", label: "Green 200" },
  { value: "#bfdbfe", label: "Blue 200" },
  { value: "#e9d5ff", label: "Purple 200" },
  { value: "#fbcfe8", label: "Pink 200" },
  { value: "#fde68a", label: "Yellow 200" },
  { value: "#fdba74", label: "Orange 200" },
] as const

export type TextColorOption = (typeof TEXT_COLOR_OPTIONS)[number]["value"]

export const DEFAULT_SYMBOL = "utensils"
export const DEFAULT_COLOR = COLOR_OPTIONS[0]
export const DEFAULT_TEXT_COLOR = "#ffffff"
