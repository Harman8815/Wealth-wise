"use client"

import { cn } from "@/lib/utils"
import type { RecurringStatus } from "@/api/services"

const STATUS_STYLES: Record<RecurringStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
}

export function StatusBadge({ status }: { status: RecurringStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.active
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.label}
    </span>
  )
}
