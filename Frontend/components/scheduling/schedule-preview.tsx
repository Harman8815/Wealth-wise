"use client"

import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { previewOccurrences, formatScheduleSummary, type ScheduleConfig } from "@/lib/scheduling"

interface SchedulePreviewProps {
  config: ScheduleConfig
  count?: number
}

/**
 * Reusable live preview of upcoming execution dates for any schedule config.
 */
export function SchedulePreview({ config, count = 5 }: SchedulePreviewProps) {
  const dates = previewOccurrences(config, count)
  const summary = formatScheduleSummary(config)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <CalendarDays className="h-4 w-4 text-blue-500" />
        {summary}
      </p>
      {dates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming dates in range.</p>
      ) : (
        <ul className="space-y-1.5">
          {dates.map((d, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 text-sm",
                i === 0 ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {d.toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {i === 0 && <span className="text-xs text-blue-500">(next)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
