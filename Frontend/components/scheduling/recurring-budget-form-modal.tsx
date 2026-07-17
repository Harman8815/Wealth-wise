"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FrequencySelector, ScheduleBuilder, type ScheduleBuilderValue } from "@/components/scheduling/schedule-builder"
import { SchedulePreview } from "@/components/scheduling/schedule-preview"
import { CategoryAllocationEditor } from "@/components/scheduling/category-allocation-editor"
import { BudgetStrategySelector } from "@/components/scheduling/budget-strategy-selector"
import { useAccounts } from "@/hooks"
import { useCreateRecurringBudget, useUpdateRecurringBudget } from "@/hooks/use-recurring-budgets"
import { toast } from "@/hooks/use-toast"
import type {
  RecurringBudget,
  CreateRecurringBudgetInput,
  RecurringFrequency,
  BudgetStrategy,
  BudgetAllocation,
} from "@/api/services"
import type { ScheduleConfig } from "@/lib/scheduling"
import { previewOccurrences } from "@/lib/scheduling"

interface RecurringBudgetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: RecurringBudget | null
}

const todayISO = () => new Date().toISOString().slice(0, 10)

function defaultBuilder(): ScheduleBuilderValue {
  return {
    frequency: 'monthly',
    interval: 1,
    weekdays: [],
    day_of_month: 1,
    last_day_of_month: false,
  }
}

export function RecurringBudgetFormModal({ open, onOpenChange, editing }: RecurringBudgetFormModalProps) {
  const { data: accountsData } = useAccounts()
  const createBudget = useCreateRecurringBudget()
  const updateBudget = useUpdateRecurringBudget()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [totalBudget, setTotalBudget] = useState("")
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [strategy, setStrategy] = useState<BudgetStrategy>("copy_structure")
  const [adjustmentPercent, setAdjustmentPercent] = useState(0)
  const [autoCarryForward, setAutoCarryForward] = useState(false)
  const [autoAdjustPrevious, setAutoAdjustPrevious] = useState(false)
  const [builder, setBuilder] = useState<ScheduleBuilderValue>(defaultBuilder())
  const [startDate, setStartDate] = useState(todayISO())
  const [neverEnds, setNeverEnds] = useState(true)
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description || "")
      setTotalBudget(String(editing.total_budget))
      setAllocations(
        (editing.categories || []).map((c) => ({
          name: c.name,
          budgeted: c.budgeted,
          color: c.color,
          symbol: c.symbol,
          category: c.category,
        }))
      )
      setStrategy(editing.strategy)
      setAdjustmentPercent(Number(editing.adjustment_percent))
      setAutoCarryForward(editing.auto_carry_forward)
      setAutoAdjustPrevious(editing.auto_adjust_previous)
      setBuilder({
        frequency: editing.frequency,
        interval: editing.interval,
        weekdays: editing.weekdays || [],
        day_of_month: editing.day_of_month,
        last_day_of_month: editing.last_day_of_month,
      })
      setStartDate(editing.start_date)
      setNeverEnds(editing.never_ends)
      setEndDate(editing.end_date || "")
    } else {
      setName("")
      setDescription("")
      setTotalBudget("")
      setAllocations([{ name: "", budgeted: 0, color: "#3b82f6", symbol: "utensils" }])
      setStrategy("copy_structure")
      setAdjustmentPercent(0)
      setAutoCarryForward(false)
      setAutoAdjustPrevious(false)
      setBuilder(defaultBuilder())
      setStartDate(todayISO())
      setNeverEnds(true)
      setEndDate("")
    }
  }, [open, editing])

  const scheduleConfig: ScheduleConfig = useMemo(
    () => ({
      frequency: builder.frequency,
      interval: builder.interval,
      weekdays: builder.weekdays,
      dayOfMonth: builder.day_of_month,
      lastDayOfMonth: builder.last_day_of_month,
      startDate: new Date(startDate),
      end_date: neverEnds ? null : endDate ? new Date(endDate) : null,
      never_ends: neverEnds,
    }),
    [builder, startDate, neverEnds, endDate]
  )

  const estimatedBudgets = useMemo(() => {
    const dates = previewOccurrences(scheduleConfig, 5)
    return dates
  }, [scheduleConfig])

  const handleSubmit = async () => {
    if (!name || !totalBudget) {
      toast({ title: "Missing fields", description: "Name and total budget are required." })
      return
    }
    if (allocations.length === 0 || allocations.some((a) => !a.name)) {
      toast({ title: "Invalid categories", description: "Every category needs a name." })
      return
    }
    const payload: CreateRecurringBudgetInput = {
      name,
      description,
      total_budget: Number(totalBudget),
      categories: allocations,
      strategy,
      adjustment_percent: adjustmentPercent,
      auto_carry_forward: autoCarryForward,
      auto_adjust_previous: autoAdjustPrevious,
      frequency: builder.frequency,
      interval: builder.interval,
      weekdays: builder.weekdays,
      day_of_month: builder.day_of_month,
      last_day_of_month: builder.last_day_of_month,
      start_date: startDate,
      never_ends: neverEnds,
      end_date: neverEnds ? null : endDate || null,
    }

    try {
      if (editing) {
        await updateBudget.mutateAsync({ id: editing.id, data: payload })
        toast({ title: "Rule updated", description: `${name} was updated.` })
      } else {
        await createBudget.mutateAsync(payload)
        toast({ title: "Rule created", description: `${name} was scheduled.` })
      }
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Failed to save",
        description: err?.response?.data?.detail || err?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const isSubmitting = createBudget.isPending || updateBudget.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Recurring Budget" : "New Recurring Budget"}</DialogTitle>
          <DialogDescription>
            Automatically generate planned budgets (₹{Number(totalBudget || 0).toLocaleString()}) on a
            schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rb-name">Budget Name</Label>
              <Input
                id="rb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Household Budget"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rb-total">Total Budget (₹)</Label>
              <Input
                id="rb-total"
                type="number"
                min={0}
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rb-notes">Notes</Label>
            <Textarea
              id="rb-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Category allocations */}
          <div className="space-y-2 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">Category Allocations</Label>
            <CategoryAllocationEditor allocations={allocations} onChange={setAllocations} />
          </div>

          {/* Generation strategy */}
          <div className="space-y-2 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">Generation Strategy</Label>
            <BudgetStrategySelector
              value={strategy}
              onChange={setStrategy}
              adjustmentPercent={adjustmentPercent}
              onAdjustmentPercentChange={setAdjustmentPercent}
              autoCarryForward={autoCarryForward}
              onAutoCarryForwardChange={setAutoCarryForward}
              autoAdjustPrevious={autoAdjustPrevious}
              onAutoAdjustPreviousChange={setAutoAdjustPrevious}
            />
          </div>

          {/* Scheduling */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">Schedule</Label>
            <FrequencySelector
              value={builder.frequency}
              onChange={(f: RecurringFrequency) => setBuilder({ ...builder, frequency: f })}
            />
            <ScheduleBuilder value={builder} onChange={setBuilder} startDate={startDate} />
            <SchedulePreview config={scheduleConfig} />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rb-start">Start Date</Label>
              <Input
                id="rb-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch checked={neverEnds} onCheckedChange={setNeverEnds} id="rb-never" />
                <Label htmlFor="rb-never">Never ends</Label>
              </div>
              {!neverEnds && (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="rb-end">End Date</Label>
                  <Input
                    id="rb-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Upcoming generations</p>
            <p>
              {estimatedBudgets.length > 0
                ? `${estimatedBudgets.length} budget(s) will be created, starting ${estimatedBudgets[0].toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}.`
                : "No upcoming dates in range."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editing ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
