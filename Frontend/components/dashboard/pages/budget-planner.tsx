"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Menu, Plus, Edit, TrendingUp, AlertTriangle, Eye } from "lucide-react"
import { useBudgetOverview, useBudgetCategories, useUpdateBudgetCategory } from "@/hooks"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { BudgetGauge } from "@/components/dashboard/budget-gauge"
import Link from "next/link"
import { AddCategoryDialog } from "../add-category-dialog"
import { ICON_MAP } from "../symbol-picker"
import { CATEGORY_SYMBOLS, DEFAULT_TEXT_COLOR } from "@/data/category-symbols"
import { toast } from "@/hooks/use-toast"

interface BudgetCategory {
  id: string
  name: string
  budgeted: number
  spent: number
  color: string
  text_color: string
  symbol: string
}

export function BudgetPlannerPage() {
  const { openSidebar } = useDashboardSidebar()
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const updateMutation = useUpdateBudgetCategory()
  const { data: budgetOverview, isLoading: isLoadingOverview } = useBudgetOverview()
  const { data: budgetCategoriesData, isLoading: isLoadingCategories } = useBudgetCategories()

  const budgetCategories = budgetCategoriesData?.results || []
  const totalBudgeted = budgetOverview?.total_budgeted || 0
  const totalSpent = budgetOverview?.total_spent || 0
  const remainingBudget = budgetOverview?.total_remaining || 0
  const overallPercentage = budgetOverview?.overall_percentage || 0

  // Sort categories by highest consumption (spent/budgeted ratio)
  const sortedCategories = [...budgetCategories].sort((a, b) => {
    const pctA = (a.spent / a.budgeted) * 100
    const pctB = (b.spent / b.budgeted) * 100
    return pctB - pctA
  })

  function getCategoryDisplay(category: BudgetCategory) {
    const icon = ICON_MAP[category.symbol || "utensils"] || ICON_MAP.utensils
    const textColor = category.text_color || DEFAULT_TEXT_COLOR
    return { icon, textColor }
  }

  if (isLoadingOverview || isLoadingCategories) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
        <Card className="h-96">
          <Skeleton className="h-full" />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h1>
              <p className="text-gray-600 dark:text-gray-400">Plan and track your monthly budget</p>
            </div>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </header>

      <AddCategoryDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <EditBudgetModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSave={(newBudget) => {
          if (editingCategory) {
            updateMutation.mutateAsync({ id: editingCategory.id, data: { budgeted: newBudget } })
              .then(() => {
                toast({ title: "Budget updated", description: "Category budget was updated successfully." })
                setEditingCategory(null)
              })
              .catch((err: any) => {
                toast({ title: "Failed to update budget", description: err?.response?.data?.detail || err?.message || "Please try again." })
              })
          }
        }}
      />

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Budget Overview — Hero */}
        <Card className="overflow-hidden border-2 border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Budget Overview</CardTitle>
            <CardDescription>Your spending progress across all categories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <BudgetGauge
              totalBudget={totalBudgeted}
              spent={totalSpent}
              remaining={remainingBudget}
              percentage={overallPercentage}
              size={320}
            />

            {/* Stat cards surrounding the gauge */}
            <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₹{totalBudgeted.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly allocation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : "0.0"}% of budget
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{remainingBudget.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {remainingBudget >= 0 ? "Under budget" : "Over budget"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Category Budgets */}
        <Card>
          <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
            <CardDescription>Manage your budget allocation by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {sortedCategories.map((category) => {
                const percentage = (category.spent / category.budgeted) * 100
                const isOverBudget = category.spent > category.budgeted
                const isNearLimit = percentage >= 90 && !isOverBudget
                const { icon, textColor } = getCategoryDisplay(category)

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: category.color }}
                        >
                          <span style={{ color: textColor }}>{icon}</span>
                        </div>
                        <h3 className="font-medium">{category.name}</h3>
                        {isOverBudget && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Over Budget
                          </Badge>
                        )}
                        {isNearLimit && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Near Limit
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ₹{category.spent.toLocaleString()} / ₹{category.budgeted.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}% used</div>
                        </div>
                        <Link href={`/dashboard/budget/${encodeURIComponent(category.name)}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-orange-500" : ""}`}
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Remaining: ₹{Math.max(0, category.budgeted - category.spent).toLocaleString()}</span>
                      {isOverBudget && (
                        <span className="text-red-600">
                          Over by: ₹{(category.spent - category.budgeted).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Budget Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Smart Allocation</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt repayment.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🎯 Track Progress</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Review your budget weekly and adjust categories based on your actual spending patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

interface EditBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  category: BudgetCategory | null
  onSave: (newBudget: number) => void
}

function EditBudgetModal({ isOpen, onClose, category, onSave }: EditBudgetModalProps) {
  const [newBudget, setNewBudget] = useState(0)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSave(newBudget)
  }

  const oldPercentage = category ? (category.spent / category.budgeted) * 100 : 0
  const newPercentage = category && newBudget > 0 ? (category.spent / newBudget) * 100 : 0

  if (!category) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <span style={{ color: category.text_color }}>{ICON_MAP[category.symbol || "utensils"] || ICON_MAP.utensils}</span>
              </div>
              <h3 className="font-medium text-lg">{category.name}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Budget</div>
              <div className="text-lg font-semibold">₹{category.budgeted.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Used</div>
              <div className="text-lg font-semibold">₹{category.spent.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Budget Amount</label>
            <Input
              type="number"
              value={newBudget || ""}
              onChange={(e) => setNewBudget(Number(e.target.value))}
              placeholder="₹0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Old Percentage</span>
              <span className={`text-sm font-medium ${
                oldPercentage > 100 ? "text-red-600" : oldPercentage > 90 ? "text-orange-600" : "text-green-600"
              }`}>
                {oldPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Percentage</span>
              <span className={`text-sm font-medium ${
                newPercentage > 100 ? "text-red-600" : newPercentage > 90 ? "text-orange-600" : "text-green-600"
              }`}>
                {newBudget > 0 ? newPercentage.toFixed(1) : "0.0"}%
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}