"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarClock, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecurringBudgets } from "@/hooks/use-recurring-budgets"
import type { RecurringBudget } from "@/api/services"

/**
 * Dashboard widget summarizing recurring-budget activity: active rule count,
 * total planned budget across active rules, and the next scheduled generation.
 */
export function RecurringBudgetSummaryWidget() {
  const { data, isLoading } = useRecurringBudgets()

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const rules = data?.results || []
  const active = rules.filter((r) => r.status === "active")
  const plannedTotal = active.reduce((sum, r) => sum + (Number(r.total_budget) || 0), 0)

  const nextRule: RecurringBudget | null = active
    .filter((r) => r.next_generation_date)
    .sort(
      (a, b) =>
        new Date(a.next_generation_date!).getTime() - new Date(b.next_generation_date!).getTime()
    )[0] || null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-4 w-4 text-blue-500" />
          Recurring Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <Stat label="Active" value={active.length} />
          <Stat label="Planned" value={`₹${Math.round(plannedTotal).toLocaleString()}`} />
        </div>

        {nextRule ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Next: {nextRule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(nextRule.next_generation_date!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className={cn("text-sm font-semibold text-blue-600")}>
              ₹{Number(nextRule.total_budget).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">No active recurring budgets.</p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
