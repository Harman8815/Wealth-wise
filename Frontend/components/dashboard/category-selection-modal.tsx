"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useBudgetCategories } from "@/hooks"
import Link from "next/link"
import { useBudgetOverview } from "@/hooks"
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
import { CATEGORY_SYMBOLS, COLOR_OPTIONS, DEFAULT_TEXT_COLOR } from "@/data/category-symbols"

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

interface CategorySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (categoryId: string, categoryName: string) => void
}

export function CategorySelectionModal({ isOpen, onClose, onSelect }: CategorySelectionModalProps) {
  const { data: categoriesData, isLoading } = useBudgetCategories()
  const [search, setSearch] = useState("")
  const categories = categoriesData?.results || []

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No categories found.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filtered.map((category) => {
                const icon = ICON_MAP[category.symbol] || ICON_MAP.utensils
                const textColor = category.text_color || DEFAULT_TEXT_COLOR
                return (
                  <button
                    key={category.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => {
                      onSelect(category.id, category.name)
                      onClose()
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      <span style={{ color: textColor }}>{icon}</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">{category.name}</div>
                      <div className="text-xs text-gray-500">
                        ₹{Number(category.spent).toLocaleString()} / ₹{Number(category.budgeted).toLocaleString()}
                      </div>
                    </div>
                    {Number(category.spent) > Number(category.budgeted) && (
                      <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
