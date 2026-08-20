"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Menu, ArrowLeft, Sparkles, AlertTriangle, TrendingUp, Users, BarChart3, Copy } from "lucide-react"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { mlApi, type AnomaliesResponse, type ForecastResponse, type ClustersResponse, type BudgetForecastResponse } from "@/api/services"

interface SummaryCard {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  bgColor: string
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

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const [anomaliesRes, forecastRes, clustersRes, budgetRes] = await Promise.allSettled([
        mlApi.getAnomalies(),
        mlApi.getForecast(),
        mlApi.getClusters(),
        mlApi.getBudgetForecast(),
      ])

      if (anomaliesRes.status === 'fulfilled') {
        setAnomaliesCount(anomaliesRes.value.count)
      }
      if (forecastRes.status === 'fulfilled') {
        setForecastAvailable(true)
      }
      if (clustersRes.status === 'fulfilled') {
        setClustersCount(clustersRes.value.clusters?.length || 0)
      }
      if (budgetRes.status === 'fulfilled') {
        setBudgetForecastCount(budgetRes.value.forecasts?.length || 0)
      }
    } catch {
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
      bgColor: "bg-red-50 dark:bg-red-950/50",
      count: anomaliesCount !== null ? anomaliesCount : undefined,
      loadingKey: "anomalies",
    },
    {
      title: "Spending Forecast",
      description: "30-day spending prediction with Prophet and LSTM",
      icon: <TrendingUp className="w-6 h-6" />,
      href: "/dashboard/insights/forecast",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      count: forecastAvailable ? 1 : undefined,
      loadingKey: "forecast",
    },
    {
      title: "Merchant Clusters",
      description: "Segment merchants by spending behavior",
      icon: <Users className="w-6 h-6" />,
      href: "/dashboard/insights/clusters",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      count: clustersCount !== null ? clustersCount : undefined,
      loadingKey: "clusters",
    },
    {
      title: "Budget Forecast",
      description: "3-month budget category predictions",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/dashboard/insights/budget-forecast",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      count: budgetForecastCount !== null ? budgetForecastCount : undefined,
      loadingKey: "budget",
    },
    {
      title: "Duplicate Detection",
      description: "Find and resolve duplicate transactions",
      icon: <Copy className="w-6 h-6" />,
      href: "/dashboard/duplicates",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      loadingKey: "duplicates",
    },
  ]

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
              <p className="text-sm text-muted-foreground">
                ML-powered analysis, forecasts, and smart detection
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.href}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(card.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
                    {card.icon}
                  </div>
                  {card.count !== undefined && !loading && (
                    <span className="text-2xl font-bold">{card.count}</span>
                  )}
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
