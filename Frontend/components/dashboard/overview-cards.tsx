"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Balance */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹1,24,567</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500">+12.5%</span>
            <span>from last month</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Income: ₹85,000</span>
              <span>Expenses: ₹42,433</span>
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
          <div className="text-2xl font-bold">85%</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>₹42,500 of ₹50,000</span>
          </div>
          <Progress value={85} className="mt-4" />
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">⚠️ You're approaching your budget limit</p>
        </CardContent>
      </Card>

      {/* Monthly Spending */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹42,433</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-red-500" />
            <span className="text-red-500">+8.2%</span>
            <span>from last month</span>
          </div>
          <div className="mt-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Food & Dining</span>
              <span>₹12,500</span>
            </div>
            <div className="flex justify-between">
              <span>Transportation</span>
              <span>₹8,900</span>
            </div>
            <div className="flex justify-between">
              <span>Shopping</span>
              <span>₹7,200</span>
            </div>
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
          <div className="text-2xl font-bold">₹75,000</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>₹45,000 of ₹1,00,000</span>
          </div>
          <Progress value={45} className="mt-4" />
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            🎯 On track to reach your goal by March 2024
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
