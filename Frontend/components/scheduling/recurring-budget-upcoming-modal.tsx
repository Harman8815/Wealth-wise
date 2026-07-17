"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecurringBudgetUpcoming, useRecurringBudgetExecutions } from "@/hooks/use-recurring-budgets"
import type { RecurringBudget } from "@/api/services"

interface RecurringBudgetUpcomingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: RecurringBudget | null
}

export function RecurringBudgetUpcomingModal({ open, onOpenChange, rule }: RecurringBudgetUpcomingModalProps) {
  const { data: upcomingData, isLoading: loadingUpcoming } = useRecurringBudgetUpcoming(rule?.id || "", 8)
  const { data: executionsData, isLoading: loadingHistory } = useRecurringBudgetExecutions(rule?.id || "", 1, 5)

  if (!rule) return null

  const upcoming = upcomingData?.upcoming || []
  const history = executionsData?.results || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Upcoming generations
          </DialogTitle>
          <DialogDescription>
            Scheduled budget generations for <span className="font-semibold">{rule.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Next {upcoming.length || 0} dates</p>
            {loadingUpcoming ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming dates (rule may have ended).</p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((d, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      i === 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {new Date(d).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {i === 0 && <span className="text-xs text-blue-500">(next)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <History className="h-4 w-4" /> Generation history
            </p>
            {loadingHistory ? (
              <Skeleton className="h-16 w-full" />
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets generated yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between">
                    <span>
                      {new Date(h.scheduled_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="capitalize">{h.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
