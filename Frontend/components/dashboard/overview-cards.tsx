"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Target, Loader2 } from "lucide-react"
import { useAccountSummary, useTransactionSummary, useBudgetOverview, useGoalProgress } from "@/hooks"

export function OverviewCards() {
  const { data: accountSummary, isLoading: isLoadingAccounts } = useAccountSummary()
  const { data: transactionSummary, isLoading: isLoadingTransactions } = useTransactionSummary()
  const { data: budgetOverview, isLoading: isLoadingBudget } = useBudgetOverview()
  const { data: goalProgress, isLoading: isLoadingGoals } = useGoalProgress()

  const isLoading = isLoadingAccounts || isLoadingTransactions || isLoadingBudget || isLoadingGoals

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  const totalBalance = accountSummary?.total_balance || 0
  const totalBudgeted = budgetOverview?.total_budgeted || 0
  const totalSpent = budgetOverview?.total_spent || 0
  const budgetPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  const monthlyExpense = transactionSummary?.expense || 0
  const monthlyIncome = transactionSummary?.income || 0
  const totalSaved = goalProgress?.total_saved || 0
  const totalTarget = goalProgress?.total_target || 0
  const goalPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Balance */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+12.5%</span>
            <span>from last month</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Income: ₹{monthlyIncome.toLocaleString()}</span>
              <span>Expenses: ₹{monthlyExpense.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Usage */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetPercentage.toFixed(0)}%</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>₹{totalSpent.toLocaleString()} of ₹{totalBudgeted.toLocaleString()}</span>
          </div>
          <Progress value={budgetPercentage} className="mt-4" />
          {budgetPercentage > 80 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ⚠️ You&apos;re approaching your budget limit
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Spending */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlyExpense.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-red-500" />
            <span className="text-red-500">+8.2%</span>
            <span>from last month</span>
          </div>
          <div className="mt-4 space-y-1 text-xs">
            {budgetOverview?.categories?.slice(0, 3).map((cat) => (
              <div key={cat.id} className="flex justify-between">
                <span>{cat.name}</span>
                <span>₹{cat.spent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Savings Goal */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalSaved.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>₹{totalSaved.toLocaleString()} of ₹{totalTarget.toLocaleString()}</span>
          </div>
          <Progress value={goalPercentage} className="mt-4" />
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            🎯 {goalProgress?.active_goals || 0} active goals
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
