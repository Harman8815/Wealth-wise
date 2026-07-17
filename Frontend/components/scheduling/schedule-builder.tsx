"use client"

import { cn } from "@/lib/utils"
import { FREQUENCY_LABELS, WEEKDAY_LABELS } from "@/lib/scheduling"
import type { RecurringFrequency } from "@/api/services"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarClock, Repeat } from "lucide-react"

const FREQUENCIES: RecurringFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom',
]

interface FrequencySelectorProps {
  value: RecurringFrequency
  onChange: (value: RecurringFrequency) => void
}

/**
 * Reusable frequency selector used by every scheduling feature.
 */
export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {FREQUENCIES.map((freq) => {
        const active = freq === value
        return (
          <button
            key={freq}
            type="button"
            onClick={() => onChange(freq)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {FREQUENCY_LABELS[freq]}
          </button>
        )
      })}
    </div>
  )
}

export interface ScheduleBuilderValue {
  frequency: RecurringFrequency
  interval: number
  weekdays: number[]
  day_of_month: number | null
  last_day_of_month: boolean
}

interface ScheduleBuilderProps {
  value: ScheduleBuilderValue
  onChange: (value: ScheduleBuilderValue) => void
  startDate: string
}

/**
 * Reusable advanced schedule builder supporting intervals, weekdays, and
 * day-of-month / last-day-of-month rules. Drives the live preview.
 */
export function ScheduleBuilder({ value, onChange, startDate }: ScheduleBuilderProps) {
  const { frequency, interval, weekdays, day_of_month, last_day_of_month } = value

  const toggleWeekday = (day: number) => {
    const next = weekdays.includes(day)
      ? weekdays.filter((d) => d !== day)
      : [...weekdays, day]
    onChange({ ...value, weekdays: next })
  }

  return (
    <div className="space-y-4">
      {frequency !== 'weekly' && frequency !== 'monthly' && frequency !== 'quarterly' && frequency !== 'custom' && (
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm text-muted-foreground">Repeat every</Label>
          <Input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => onChange({ ...value, interval: Math.max(1, Number(e.target.value) || 1) })}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">{frequency}</span>
        </div>
      )}

      {(frequency === 'weekly') && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Repeat on</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, idx) => {
              const active = weekdays.includes(idx)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleWeekday(idx)}
                  className={cn(
                    "h-9 w-10 rounded-md border text-xs font-medium transition-colors",
                    active
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {(frequency === 'monthly' || frequency === 'quarterly' || frequency === 'custom') && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> Day of month
          </Label>
          <div className="flex items-center gap-3">
            <Label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={!last_day_of_month}
                onCheckedChange={(c) => onChange({ ...value, last_day_of_month: !c })}
              />
              Specific day
            </Label>
            {!last_day_of_month && (
              <Input
                type="number"
                min={1}
                max={31}
                value={day_of_month ?? 1}
                onChange={(e) => onChange({ ...value, day_of_month: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                className="w-20"
              />
            )}
            <Label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={last_day_of_month}
                onCheckedChange={(c) => onChange({ ...value, last_day_of_month: !!c })}
              />
              Last day of month
            </Label>
          </div>
        </div>
      )}

      {frequency === 'daily' && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Repeat every</Label>
          <Input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => onChange({ ...value, interval: Math.max(1, Number(e.target.value) || 1) })}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">day(s)</span>
        </div>
      )}
    </div>
  )
}
