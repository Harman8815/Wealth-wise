"use client"

import { useMemo } from "react"
import { AlertTriangle, Calendar, TrendingUp, Wallet } from "lucide-react"
import { BudgetGauge } from "./budget-gauge"

export interface CategoryInput {
  id?: string
  name: string
  spent: number
  budget: number
  icon?: string
}

interface BudgetOverviewPanelProps {
  totalBudget: number
  spent: number
  remaining: number
  percentage: number
  categories?: CategoryInput[]
  /** Override "today" for storybook/testing; defaults to the real current date. */
  now?: Date
  /** Cap on how large the gauge may grow. Defaults to 560px so it fills wide screens. */
  maxSize?: number
}

function formatCurrency(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? "-" : ""
  return `${sign}₹${Math.abs(rounded).toLocaleString()}`
}

function categoryStatus(spent: number, budget: number) {
  const percent = budget > 0 ? (spent / budget) * 100 : 0
  if (percent > 100) return { percent, label: "Over Budget", color: "#ef4444", bg: "bg-red-500/10", text: "text-red-500" }
  if (percent >= 80) return { percent, label: "Near Limit", color: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-500" }
  return { percent, label: "On Track", color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-500" }
}

export function BudgetOverviewPanel({
  totalBudget,
  spent,
  remaining,
  percentage,
  categories = [],
  now,
  maxSize = 560,
}: BudgetOverviewPanelProps) {
  const pacing = useMemo(() => {
    const today = now ?? new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const dayOfMonth = today.getDate()
    const daysLeft = Math.max(daysInMonth - dayOfMonth, 0)
    const avgDailySpend = dayOfMonth > 0 ? spent / dayOfMonth : 0
    const projectedSpend = avgDailySpend * daysInMonth
    const projectedPercent = totalBudget > 0 ? (projectedSpend / totalBudget) * 100 : 0
    return { daysLeft, avgDailySpend, projectedSpend, projectedPercent }
  }, [now, spent, totalBudget])

  const topCategories = useMemo(() => {
    return [...categories]
      .map((c) => ({ ...c, status: categoryStatus(c.spent, c.budget) }))
      .sort((a, b) => b.status.percent - a.status.percent)
      .slice(0, 3)
  }, [categories])

  const anyAttention = topCategories.some((c) => c.status.percent >= 80)

  return (
    <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(240px,280px)_minmax(320px,1fr)_minmax(240px,280px)] lg:gap-6 xl:grid-cols-[minmax(280px,320px)_minmax(380px,1fr)_minmax(280px,320px)] xl:gap-8 2xl:grid-cols-[minmax(320px,360px)_minmax(440px,1fr)_minmax(320px,360px)] 2xl:gap-10 justify-center">
      {/* Left: pacing insights — first in DOM so it reads naturally, but
          visually follows the gauge on small screens via `order` */}
      <div className="order-2 w-full lg:order-1">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Calendar className="h-4 w-4" />
            This Month
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Days left</span>
              <span className="text-sm font-semibold">{pacing.daysLeft}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Daily avg spend</span>
              <span className="text-sm font-semibold">{formatCurrency(pacing.avgDailySpend)}</span>
            </div>
            <div className="h-px bg-border/60" />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Projected total
                </span>
                <span
                  className={`text-sm font-semibold ${
                    pacing.projectedPercent > 100 ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {formatCurrency(pacing.projectedSpend)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {pacing.projectedPercent > 100
                  ? `On pace to go ${(pacing.projectedPercent - 100).toFixed(0)}% over budget`
                  : `On pace to stay within budget (${pacing.projectedPercent.toFixed(0)}%)`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center: the gauge itself */}
      <div className="order-1 flex w-full justify-center lg:order-2">
        <BudgetGauge totalBudget={totalBudget} spent={spent} remaining={remaining} percentage={percentage} maxSize={maxSize} />
      </div>

      {/* Right: categories needing attention */}
      <div className="order-3 w-full">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            {anyAttention ? <AlertTriangle className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
            {anyAttention ? "Needs Attention" : "Top Categories"}
          </div>

          {topCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add category budgets to see which ones need attention.
            </p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c, i) => (
                <div key={c.id ?? `${c.name}-${i}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{c.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.status.bg} ${c.status.text}`}>
                      {c.status.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(c.status.percent, 100)}%`,
                        backgroundColor: c.status.color,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {formatCurrency(c.spent)} / {formatCurrency(c.budget)}
                    </span>
                    <span>{c.status.percent.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}