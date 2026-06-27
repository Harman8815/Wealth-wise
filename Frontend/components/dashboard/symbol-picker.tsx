"use client"

import { CATEGORY_SYMBOLS, type CategorySymbol, type ColorOption, type TextColorOption } from "@/data/category-symbols"
import {
  Utensils,
  Car,
  ShoppingCart,
  Film,
  Home,
  HeartPulse,
  Fuel,
  Wifi,
  Phone,
  CreditCard,
  Gift,
  Coffee,
  Book,
  Plane,
  Dumbbell,
  Music,
  Shirt,
  Zap,
  PiggyBank,
  Briefcase,
} from "lucide-react"

const ICON_MAP: Record<string, React.ReactNode> = {
  utensils: <Utensils className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  "shopping-cart": <ShoppingCart className="w-5 h-5" />,
  film: <Film className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  "heart-pulse": <HeartPulse className="w-5 h-5" />,
  fuel: <Fuel className="w-5 h-5" />,
  wifi: <Wifi className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  "credit-card": <CreditCard className="w-5 h-5" />,
  gift: <Gift className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  book: <Book className="w-5 h-5" />,
  plane: <Plane className="w-5 h-5" />,
  dumbbell: <Dumbbell className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  shirt: <Shirt className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  "piggy-bank": <PiggyBank className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
}

interface SymbolPickerProps {
  selected: CategorySymbol
  onChange: (symbol: CategorySymbol) => void
  textColor?: TextColorOption
  bgColor?: ColorOption
}

export function SymbolPicker({ selected, onChange, textColor, bgColor }: SymbolPickerProps) {
  const iconColor = textColor === "#ffffff" ? "text-gray-700 dark:text-gray-200" : ""
  const iconStyle = textColor && textColor !== "#ffffff" ? { color: textColor } : undefined

  return (
    <div className="grid grid-cols-5 gap-2">
      {CATEGORY_SYMBOLS.map((s) => (
        <button
          key={s.value}
          type="button"
          className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors ${
            selected === s.value
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
              : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          }`}
          onClick={() => onChange(s.value)}
          title={s.label}
        >
          <span className={iconColor} style={iconStyle}>
            {ICON_MAP[s.value]}
          </span>
          <span className="text-[10px] mt-1 text-gray-500 truncate w-full text-center">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

export { ICON_MAP }
