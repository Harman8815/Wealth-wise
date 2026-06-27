"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Menu, ArrowLeft, TrendingDown, TrendingUp, Calendar, Eye, BarChart3 } from "lucide-react"
import { useBudgetCategories, useTransactions } from "@/hooks"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import Link from "next/link"
import { ICON_MAP } from "@/components/dashboard/symbol-picker"
import { DEFAULT_TEXT_COLOR } from "@/data/category-symbols"

export default function CategoryDetailPage() {
  const { openSidebar } = useDashboardSidebar()
  const params = useParams()
  const categoryName = decodeURIComponent(params.categoryName as string)

  const { data: budgetCategoriesData, isLoading: isLoadingCategories } = useBudgetCategories()
  const budgetCategory = budgetCategoriesData?.results.find(c => c.name === categoryName)

  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions({ category: categoryName })
  const transactions = transactionsData?.results || []
  const totalCount = transactionsData?.count || 0

  const icon = budgetCategory
    ? ICON_MAP[budgetCategory.symbol || "utensils"] || ICON_MAP.utensils
    : ICON_MAP.utensils
  const textColor = budgetCategory?.text_color || DEFAULT_TEXT_COLOR
  const color = budgetCategory?.color || "#3b82f6"

  const totalSpent = budgetCategory?.spent || 0
  const budgeted = budgetCategory?.budgeted || 0
  const percentage = budgeted > 0 ? (totalSpent / budgeted) * 100 : 0

  if (isLoadingCategories) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/dashboard/budget">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
                <span style={{ color: textColor }}>{icon}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{categoryName}</h1>
                <p className="text-gray-600 dark:text-gray-400">Category Details</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budgeted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">₹{budgeted.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${budgeted - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{Math.abs(budgeted - totalSpent).toLocaleString()}
              </div>
              <Badge variant={percentage > 100 ? "destructive" : percentage >= 90 ? "secondary" : "default"}>
                {percentage > 100 ? "Over Budget" : percentage >= 90 ? "Near Limit" : "Good"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Monthly Transactions
            </CardTitle>
            <CardDescription>{totalCount} transactions this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No transactions found for this category.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}