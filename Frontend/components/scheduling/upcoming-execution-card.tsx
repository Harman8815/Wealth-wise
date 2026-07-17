"use client"

import { CalendarClock, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RecurringRule } from "@/api/services"

interface UpcomingExecutionCardProps {
  rule: RecurringRule
}

/**
 * Compact widget showing the next scheduled execution for a recurring rule.
 * Reusable across the recurring page and dashboard widgets.
 */
export function UpcomingExecutionCard({ rule }: UpcomingExecutionCardProps) {
  const isIncome = rule.type === 'income'
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
          )}
        >
          {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{rule.name}</p>
          <p className="text-xs text-muted-foreground">
            {rule.next_execution_date
              ? new Date(rule.next_execution_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No upcoming date'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", isIncome ? "text-emerald-600" : "text-rose-600")}>
          {isIncome ? '+' : '-'}₹{rule.amount.toLocaleString()}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3 w-3" />
          {rule.category?.name || rule.category_name || 'Uncategorized'}
        </p>
      </div>
    </div>
  )
}
