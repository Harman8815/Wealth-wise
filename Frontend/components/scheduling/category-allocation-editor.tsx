"use client"

import { Plus, Trash2, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { COLOR_OPTIONS } from "@/data/category-symbols"
import type { BudgetAllocation } from "@/api/services"

interface CategoryAllocationEditorProps {
  allocations: BudgetAllocation[]
  onChange: (allocations: BudgetAllocation[]) => void
}

const DEFAULT_COLOR = "#3b82f6"

/**
 * Reusable editor for the category-allocation template used by recurring
 * budgets (and future planning features). Each row sets a name, budgeted amount
 * and color.
 */
export function CategoryAllocationEditor({ allocations, onChange }: CategoryAllocationEditorProps) {
  const update = (idx: number, patch: Partial<BudgetAllocation>) => {
    const next = allocations.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    onChange(next)
  }

  const add = () => {
    onChange([
      ...allocations,
      { name: "", budgeted: 0, color: DEFAULT_COLOR, symbol: "utensils" },
    ])
  }

  const remove = (idx: number) => {
    onChange(allocations.filter((_, i) => i !== idx))
  }

  const total = allocations.reduce((sum, a) => sum + (Number(a.budgeted) || 0), 0)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {allocations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add at least one category to allocate your budget.
          </p>
        )}
        {allocations.map((alloc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
            <div
              className="h-8 w-8 shrink-0 rounded-md border border-border"
              style={{ backgroundColor: alloc.color || DEFAULT_COLOR }}
            />
            <Input
              value={alloc.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              placeholder="Category name"
              className="flex-1"
            />
            <div className="relative w-32 shrink-0">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                min={0}
                value={alloc.budgeted}
                onChange={(e) => update(idx, { budgeted: Number(e.target.value) || 0 })}
                className="pl-6"
                placeholder="0"
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update(idx, { color: c })}
                  className={cn(
                    "h-5 w-5 rounded-full border transition",
                    alloc.color === c ? "ring-2 ring-offset-1 ring-blue-500" : "border-border"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Set color ${c}`}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              disabled={allocations.length === 1}
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add Category
        </Button>
        <p className="text-sm font-medium text-foreground">
          Total allocated: ₹{total.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
