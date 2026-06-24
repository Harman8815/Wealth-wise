"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Menu, Plus, Edit, TrendingUp, AlertTriangle } from "lucide-react"
import { useBudgetOverview, useBudgetCategories } from "@/hooks"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"

export function BudgetPlannerPage() {
  const { openSidebar } = useDashboardSidebar()
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: budgetOverview, isLoading: isLoadingOverview } = useBudgetOverview()
  const { data: budgetCategoriesData, isLoading: isLoadingCategories } = useBudgetCategories()

  const budgetCategories = budgetCategoriesData?.results || []
  const totalBudgeted = budgetOverview?.total_budgeted || 0
  const totalSpent = budgetOverview?.total_spent || 0
  const remainingBudget = budgetOverview?.total_remaining || 0
  const overallPercentage = budgetOverview?.overall_percentage || 0

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">₹{totalBudgeted.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly allocation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{remainingBudget.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {remainingBudget >= 0 ? "Under budget" : "Over budget"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Your spending progress across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Budget Usage</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ₹{totalSpent.toLocaleString()} / ₹{totalBudgeted.toLocaleString()}
                </span>
              </div>
              <Progress value={overallPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{overallPercentage.toFixed(1)}% used</span>
                <span>{(100 - overallPercentage).toFixed(1)}% remaining</span>
              </div>
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
              {budgetCategories.map((category) => {
                const percentage = (category.spent / category.budgeted) * 100
                const isOverBudget = category.spent > category.budgeted

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <h3 className="font-medium">{category.name}</h3>
                        {isOverBudget && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Over Budget
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ₹{category.spent.toLocaleString()} /
                            {editingId === category.id ? (
                              <Input
                                type="number"
                                defaultValue={category.budgeted}
                                className="inline-block w-24 h-6 ml-1 text-xs"
                                onBlur={() => setEditingId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setEditingId(null)
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-blue-600 ml-1"
                                onClick={() => setEditingId(category.id)}
                              >
                                ₹{category.budgeted.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}% used</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(editingId === category.id ? null : category.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`}
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
