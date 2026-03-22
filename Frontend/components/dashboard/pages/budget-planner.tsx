"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Menu, Plus, Edit, TrendingUp, AlertTriangle } from "lucide-react"

interface BudgetCategory {
  id: number
  name: string
  budgeted: number
  spent: number
  color: string
}

export function BudgetPlannerPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([
    { id: 1, name: "Food & Dining", budgeted: 15000, spent: 12500, color: "bg-red-500" },
    { id: 2, name: "Transportation", budgeted: 8000, spent: 6800, color: "bg-blue-500" },
    { id: 3, name: "Shopping", budgeted: 10000, spent: 7200, color: "bg-green-500" },
    { id: 4, name: "Entertainment", budgeted: 5000, spent: 3200, color: "bg-purple-500" },
    { id: 5, name: "Bills & Utilities", budgeted: 12000, spent: 11500, color: "bg-orange-500" },
    { id: 6, name: "Healthcare", budgeted: 3000, spent: 1200, color: "bg-pink-500" },
  ])

  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0)
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const remainingBudget = totalBudgeted - totalSpent

  const handleEditBudget = (id: number, newBudget: number) => {
    setBudgetCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, budgeted: newBudget } : cat)))
    setEditingId(null)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
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
              <Progress value={(totalSpent / totalBudgeted) * 100} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{((totalSpent / totalBudgeted) * 100).toFixed(1)}% used</span>
                <span>{((remainingBudget / totalBudgeted) * 100).toFixed(1)}% remaining</span>
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
                        <div className={`w-4 h-4 rounded-full ${category.color}`} />
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
                                onBlur={(e) => handleEditBudget(category.id, Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditBudget(category.id, Number(e.currentTarget.value))
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
