"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Menu,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Copy,
  RefreshCw,
} from "lucide-react"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { mlApi, type AnomaliesResponse, type ForecastResponse, type ClustersResponse, type BudgetForecastResponse } from "@/api/services"
import { cn } from "@/lib/utils"

interface SummaryCard {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  bgColor: string
  borderColor: string
  count?: number
  loadingKey: string
}

export default function AIInsightsPage() {
  const router = useRouter()
  const { openSidebar } = useDashboardSidebar()
  const [anomaliesCount, setAnomaliesCount] = useState<number | null>(null)
  const [forecastAvailable, setForecastAvailable] = useState(false)
  const [clustersCount, setClustersCount] = useState<number | null>(null)
  const [budgetForecastCount, setBudgetForecastCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [anomaliesRes, forecastRes, clustersRes, budgetRes] = await Promise.allSettled([
        mlApi.getAnomalies(),
        mlApi.getForecast(),
        mlApi.getClusters(),
        mlApi.getBudgetForecast(),
      ])

      if (anomaliesRes.status === "fulfilled") {
        setAnomaliesCount(anomaliesRes.value.count)
      }
      if (forecastRes.status === "fulfilled") {
        const forecast = forecastRes.value
        const hasForecast = (forecast.prophet?.length ?? 0) > 0 || (forecast.lstm?.forecast?.length ?? 0) > 0 || (forecast.csv_data?.length ?? 0) > 0
        setForecastAvailable(hasForecast)
      }
      if (clustersRes.status === "fulfilled") {
        setClustersCount(clustersRes.value.clusters?.length || 0)
      }
      if (budgetRes.status === "fulfilled") {
        setBudgetForecastCount(budgetRes.value.forecasts?.length || 0)
      }
    } catch {
      setError("Failed to load AI insights summary")
      toast.error("Failed to load AI insights summary")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const cards: SummaryCard[] = [
    {
      title: "Anomalies",
      description: "Detect unusual transactions using Isolation Forest",
      icon: <AlertTriangle className="w-6 h-6" />,
      href: "/dashboard/insights/anomalies",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800/50",
      count: anomaliesCount !== null ? anomaliesCount : undefined,
      loadingKey: "anomalies",
    },
    {
      title: "Spending Forecast",
      description: "30-day spending prediction with Prophet and LSTM",
      icon: <TrendingUp className="w-6 h-6" />,
      href: "/dashboard/insights/forecast",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800/50",
      count: forecastAvailable ? 1 : undefined,
      loadingKey: "forecast",
    },
    {
      title: "Merchant Clusters",
      description: "Segment merchants by spending behavior",
      icon: <Users className="w-6 h-6" />,
      href: "/dashboard/insights/clusters",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800/50",
      count: clustersCount !== null ? clustersCount : undefined,
      loadingKey: "clusters",
    },
    {
      title: "Budget Forecast",
      description: "3-month budget category predictions",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/dashboard/insights/budget-forecast",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800/50",
      count: budgetForecastCount !== null ? budgetForecastCount : undefined,
      loadingKey: "budget",
    },
    {
      title: "Duplicate Detection",
      description: "Find and resolve duplicate transactions",
      icon: <Copy className="w-6 h-6" />,
      href: "/dashboard/duplicates",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800/50",
      loadingKey: "duplicates",
    },
  ]

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  AI Insights
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                ML-powered analysis, forecasts, and smart detection
              </p>
            </div>
          </div>
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSummary}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.href}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
                "border-border/60"
              )}
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={cn("p-3 rounded-xl", card.bgColor, card.color)}>
                    {card.icon}
                  </div>
                  {card.count !== undefined && !loading && (
                    <span className="text-2xl font-bold tabular-nums">{card.count}</span>
                  )}
                  {loading && card.count !== undefined && (
                    <Skeleton className="h-8 w-12 rounded-md" />
                  )}
                </div>
                <CardTitle className="mt-4 text-base">{card.title}</CardTitle>
                <CardDescription className="text-sm">{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="text-xs font-medium uppercase tracking-wider">Explore</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.loadingKey} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-8 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-24 mt-4 rounded-md" />
                  <Skeleton className="h-4 w-full mt-2 rounded-md" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-16 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && cards.every((c) => c.count === undefined) && (
          <div className="text-center py-12 rounded-xl border border-dashed border-border/60 bg-muted/20">
            <Sparkles className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No insights available yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add transactions and budgets to generate AI-powered insights
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

