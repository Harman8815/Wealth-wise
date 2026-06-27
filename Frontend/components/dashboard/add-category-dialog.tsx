"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  CATEGORY_SYMBOLS,
  COLOR_OPTIONS,
  TEXT_COLOR_OPTIONS,
  DEFAULT_SYMBOL,
  DEFAULT_COLOR,
  DEFAULT_TEXT_COLOR,
} from "@/data/category-symbols"
import { SearchableCategoryInput } from "@/components/ui/searchable-category-input"
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
import { useCreateBudgetCategory, useUpdateBudgetCategory } from "@/hooks"
import { toast } from "@/hooks/use-toast"

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

interface AddCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  category?: {
    id: string
    name: string
    budgeted: number
    color: string
    text_color: string
    symbol: string
  }
}

export function AddCategoryDialog({ isOpen, onClose, category }: AddCategoryDialogProps) {
  const createMutation = useCreateBudgetCategory()
  const updateMutation = useUpdateBudgetCategory()
  const isEditing = !!category

  const [name, setName] = useState(category?.name || "")
  const [budgeted, setBudgeted] = useState(category?.budgeted?.toString() || "")
  const [color, setColor] = useState<string>(category?.color || DEFAULT_COLOR)
  const [textColor, setTextColor] = useState<string>(category?.text_color || DEFAULT_TEXT_COLOR)
  const [symbol, setSymbol] = useState<string>(category?.symbol || DEFAULT_SYMBOL)

  const isPending = createMutation.isPending || updateMutation.isPending

  const resetForm = () => {
    setName("")
    setBudgeted("")
    setColor(DEFAULT_COLOR)
    setTextColor(DEFAULT_TEXT_COLOR)
    setSymbol(DEFAULT_SYMBOL)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e?: any) => {
    e?.preventDefault()
    if (!name || !budgeted) {
      toast({ title: "Missing fields", description: "Please fill in all required fields" })
      return
    }
    try {
      if (isEditing && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          data: { name, budgeted: Number(budgeted), color, text_color: textColor, symbol },
        })
        toast({ title: "Category updated", description: "Budget category was updated successfully." })
      } else {
        await createMutation.mutateAsync({
          name,
          budgeted: Number(budgeted),
          color,
          text_color: textColor,
          symbol,
        })
        toast({ title: "Category added", description: "Budget category was created successfully." })
      }
      handleClose()
    } catch (err: any) {
      toast({
        title: isEditing ? "Failed to update category" : "Failed to add category",
        description: err?.response?.data?.detail || err?.message || "Please try again.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Budget Category" : "Add Budget Category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <SearchableCategoryInput
              value={name}
              onValueChange={setName}
              placeholder="Select or create category..."
              type="budget"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgeted">Budgeted Amount</Label>
            <Input
              id="budgeted"
              type="number"
              value={budgeted}
              onChange={(e) => setBudgeted(e.target.value)}
              placeholder="₹0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Symbol</Label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_SYMBOLS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors ${
                    symbol === s.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
                  onClick={() => setSymbol(s.value)}
                  title={s.label}
                >
                  <span className={textColor === "#ffffff" ? "text-gray-700 dark:text-gray-200" : ""} style={{ color: textColor === "#ffffff" ? undefined : textColor }}>
                    {ICON_MAP[s.value]}
                  </span>
                  <span className="text-[10px] mt-1 text-gray-500 truncate w-full text-center">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Background Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-black dark:border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_color">Text Color</Label>
            <div className="flex gap-2 flex-wrap">
              {TEXT_COLOR_OPTIONS.map((tc) => (
                <button
                  key={tc.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${textColor === tc.value ? "border-black dark:border-white" : "border-transparent"}`}
                  style={{ backgroundColor: tc.value }}
                  onClick={() => setTextColor(tc.value)}
                  title={tc.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
