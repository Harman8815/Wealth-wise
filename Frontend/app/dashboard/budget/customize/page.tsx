"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Search, ArrowLeft } from "lucide-react"
import { useBudgetCategories, useDeleteBudgetCategory } from "@/hooks"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import Link from "next/link"
import { AddCategoryDialog } from "@/components/dashboard/add-category-dialog"
import { DEFAULT_TEXT_COLOR, DEFAULT_SYMBOL } from "@/data/category-symbols"
import { ICON_MAP } from "@/components/dashboard/symbol-picker"
import { toast } from "@/hooks/use-toast"

export default function CategoryCustomizePage() {
  const { openSidebar } = useDashboardSidebar()
  const { data: budgetCategoriesData, isLoading, refetch } = useBudgetCategories()
  const deleteMutation = useDeleteBudgetCategory()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{
    id: string
    name: string
    budgeted: number
    color: string
    text_color: string
    symbol: string
  } | null>(null)
  const [search, setSearch] = useState("")

  const categories = budgetCategoriesData?.results || []

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({ title: "Category deleted", description: `${name} was removed.` })
      refetch()
    } catch (err: any) {
      toast({
        title: "Failed to delete category",
        description: err?.response?.data?.detail || err?.message || "Please try again.",
      })
    }
  }

  const handleEdit = (category: typeof editingCategory) => {
    setEditingCategory(category)
    setIsAddOpen(true)
  }

  const handleCloseDialog = () => {
    setIsAddOpen(false)
    setEditingCategory(null)
    refetch()
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Search className="w-5 h-5" />
            </Button>
            <Link href="/dashboard/budget">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Categories</h1>
              <p className="text-gray-600 dark:text-gray-400">Personalize symbols, colors, and text colors</p>
            </div>
          </div>
          <Button onClick={() => { setEditingCategory(null); setIsAddOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>{categories.length} categories configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No categories found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((category) => {
                  const icon = ICON_MAP[category.symbol] || ICON_MAP.utensils
                  const textColor = category.text_color || DEFAULT_TEXT_COLOR
                  const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0
                  const isOverBudget = category.spent > category.budgeted

                  return (
                    <Card key={category.id} className="group relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: category.color }}
                            >
                              <span style={{ color: textColor }}>{icon}</span>
                            </div>
                            <div>
                              <div className="font-semibold">{category.name}</div>
                              <div className="text-xs text-gray-500">
                                ₹{Number(category.spent).toLocaleString()} / ₹{Number(category.budgeted).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                handleEdit({
                                  id: category.id,
                                  name: category.name,
                                  budgeted: Number(category.budgeted),
                                  color: category.color,
                                  text_color: textColor,
                                  symbol: category.symbol,
                                })
                              }
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(category.id, category.name)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{percentage.toFixed(1)}% used</span>
                            {isOverBudget && (
                              <span className="text-red-600">
                                Over by ₹{(Number(category.spent) - Number(category.budgeted)).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: isOverBudget ? "#ef4444" : category.color,
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {category.symbol || DEFAULT_SYMBOL}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              borderColor: category.color,
                              color: category.color,
                            }}
                          >
                            {category.color}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              borderColor: textColor,
                              color: textColor,
                              backgroundColor: textColor === "#ffffff" ? "transparent" : textColor + "20",
                            }}
                          >
                            {textColor}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddCategoryDialog
        isOpen={isAddOpen}
        onClose={handleCloseDialog}
        category={editingCategory || undefined}
      />
    </div>
  )
}
