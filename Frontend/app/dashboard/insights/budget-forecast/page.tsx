"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { toast } from "sonner"
import { mlApi, type BudgetForecastResponse } from "@/api/services"

export default function BudgetForecastPageRoute() {
  const { openSidebar } = useDashboardSidebar()
  const [forecasts, setForecasts] = useState<BudgetForecastResponse['forecasts']>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadForecast = async () => {
    setLoading(true)
    try {
      const data = await mlApi.getBudgetForecast()
      setForecasts(data.forecasts)
    } catch (error) {
      console.error('Failed to load budget forecast', error)
      toast.error('Failed to load budget forecast')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadForecast()
      toast.success('Budget forecast refreshed')
    } catch {
      toast.error('Failed to refresh budget forecast')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-48">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <TrendingUp className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Forecast</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {forecasts.length} budget categories with 3-month forecast
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </header>

      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No budget forecast available</p>
            <p className="text-sm text-muted-foreground">Create budget categories to see forecasts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.map((item) => {
            const isOverBudget = item.current_spent > item.budget
            const variance = item.budget - item.current_spent
            const chartData = item.forecast.map((f) => ({
              month: `Month ${f.month}`,
              predicted: f.predicted_spend,
              budget: f.budget,
            }))

            return (
              <Card key={item.category} className={isOverBudget ? 'border-red-200 dark:border-red-800' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{item.category}</CardTitle>
                    {isOverBudget ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Over Budget
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                        <CheckCircle2 className="w-3 h-3" />
                        On Track
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Monthly avg: ₹{item.monthly_average.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Spent</p>
                        <p className="text-lg font-bold">₹{item.current_spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-lg font-bold">₹{item.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "currentColor" }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "currentColor" }}
                            className="text-muted-foreground"
                            tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                          <Bar dataKey="predicted" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Predicted" />
                          <Bar dataKey="budget" fill="#10b981" radius={[3, 3, 0, 0]} name="Budget" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Variance</span>
                      <span className={variance >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                        {variance >= 0 ? '+' : ''}₹{variance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
