"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarClock, ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecurringRules } from "@/hooks/use-recurring"
import type { RecurringRule } from "@/api/services"

/**
 * Dashboard widget summarizing recurring activity: counts, monthly recurring
 * expense estimate, and the next scheduled transaction.
 */
export function RecurringSummaryWidget() {
  const { data, isLoading } = useRecurringRules()

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
  const expenses = active.filter((r) => r.type === "expense")
  const incomes = active.filter((r) => r.type === "income")

  const monthlyExpense = estimateMonthly(expenses)
  const monthlyIncome = estimateMonthly(incomes)

  const nextRule: RecurringRule | null = active
    .filter((r) => r.next_execution_date)
    .sort(
      (a, b) =>
        new Date(a.next_execution_date!).getTime() - new Date(b.next_execution_date!).getTime()
    )[0] || null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-4 w-4 text-blue-500" />
          Recurring Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Active" value={active.length} />
          <Stat label="Mo. Expense" value={`₹${Math.round(monthlyExpense).toLocaleString()}`} />
          <Stat label="Mo. Income" value={`₹${Math.round(monthlyIncome).toLocaleString()}`} />
        </div>

        {nextRule ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Next: {nextRule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(nextRule.next_execution_date!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                nextRule.type === "income" ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {nextRule.type === "income" ? (
                <ArrowUpRight className="inline h-4 w-4" />
              ) : (
                <ArrowDownLeft className="inline h-4 w-4" />
              )}
              ₹{nextRule.amount.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">No active recurring rules.</p>
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

/** Rough monthly normalization across frequencies for the dashboard summary. */
function estimateMonthly(rules: RecurringRule[]): number {
  let total = 0
  for (const r of rules) {
    const amount = Number(r.amount) || 0
    switch (r.frequency) {
      case "daily":
        total += amount * 30 * (1 / Math.max(1, r.interval))
        break
      case "weekly":
        total += amount * 4.33 * (1 / Math.max(1, r.interval))
        break
      case "quarterly":
        total += (amount / 3) * (1 / Math.max(1, r.interval))
        break
      case "yearly":
        total += (amount / 12) * (1 / Math.max(1, r.interval))
        break
      case "monthly":
      case "custom":
      default:
        total += amount * (1 / Math.max(1, r.interval))
        break
    }
  }
  return total
}
