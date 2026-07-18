"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { useFinancialHealth, useRecomputeHealth } from "@/hooks"
import { useRouter } from "next/navigation"

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400"
    case "B":
      return "text-green-600 dark:text-green-400"
    case "C":
      return "text-yellow-600 dark:text-yellow-400"
    case "D":
      return "text-orange-600 dark:text-orange-400"
    default:
      return "text-red-600 dark:text-red-400"
  }
}

export function FinancialHealthCard() {
  const { data, isLoading, isError } = useFinancialHealth()
  const recompute = useRecomputeHealth()
  const router = useRouter()

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-32 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load your score. Add transactions, budgets, or goals to generate one.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => recompute.mutate()}
            disabled={recompute.isPending}
          >
            <RefreshCw className={recompute.isPending ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
            Calculate
          </Button>
        </CardContent>
      </Card>
    )
  }

  const trendIcon =
    data.trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : data.trend === "down" ? (
      <TrendingDown className="w-4 h-4 text-red-500" />
    ) : (
      <Minus className="w-4 h-4 text-muted-foreground" />
    )

  const delta =
    data.previous_score != null ? Math.round(Number(data.score) - Number(data.previous_score)) : null

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Financial Health</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => recompute.mutate()}
          disabled={recompute.isPending}
          aria-label="Recalculate score"
        >
          <RefreshCw className={recompute.isPending ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-end justify-center gap-2">
          <span className={`text-6xl font-bold ${gradeColor(data.grade)}`}>
            {Number(data.score).toFixed(1)}
          </span>
          <div className="flex flex-col items-start pb-2">
            <Badge variant="outline" className={gradeColor(data.grade)}>
              {data.grade} · {data.grade_label}
            </Badge>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {trendIcon}
              {delta != null && delta !== 0 ? (
                <span>
                  {delta > 0 ? "+" : ""}
                  {delta} vs last
                </span>
              ) : (
                <span>No change</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {data.strengths.slice(0, 2).map((s) => (
            <div
              key={s.dimension}
              className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">{s.label}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 truncate">{s.explanation}</p>
              </div>
            </div>
          ))}
          {data.risks.slice(0, 1).map((r) => (
            <div
              key={r.dimension}
              className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-red-900 dark:text-red-100">{r.label}</p>
                <p className="text-xs text-red-700 dark:text-red-300 truncate">{r.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-auto pt-4 justify-start text-muted-foreground"
          onClick={() => router.push("/dashboard/reports?tab=health")}
        >
          View full report
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
