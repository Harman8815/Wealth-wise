"use client"

import { useEffect, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableCategoryInput } from "@/components/ui/searchable-category-input"
import { FrequencySelector, ScheduleBuilder, type ScheduleBuilderValue } from "@/components/scheduling/schedule-builder"
import { SchedulePreview } from "@/components/scheduling/schedule-preview"
import { useAccounts } from "@/hooks"
import { useCreateRecurring, useUpdateRecurring } from "@/hooks/use-recurring"
import { toast } from "@/hooks/use-toast"
import type {
  RecurringRule,
  CreateRecurringInput,
  RecurringFrequency,
  RecurringType,
} from "@/api/services"
import type { ScheduleConfig } from "@/lib/scheduling"

interface RecurringFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: RecurringRule | null
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

export function RecurringFormModal({ open, onOpenChange, editing }: RecurringFormModalProps) {
  const { data: accountsData } = useAccounts()
  const createRecurring = useCreateRecurring()
  const updateRecurring = useUpdateRecurring()

  const accounts = accountsData?.results || []

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<RecurringType>("expense")
  const [categoryName, setCategoryName] = useState<string>("")
  const [account, setAccount] = useState<string>("")
  const [builder, setBuilder] = useState<ScheduleBuilderValue>(defaultBuilder())
  const [startDate, setStartDate] = useState(todayISO())
  const [neverEnds, setNeverEnds] = useState(true)
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description || "")
      setAmount(String(editing.amount))
      setType(editing.type)
      setCategoryName(editing.category?.name || editing.category_name || "")
      setAccount(editing.account || "")
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
      setAmount("")
      setType("expense")
      setCategoryName("")
      setAccount("")
      setBuilder(defaultBuilder())
      setStartDate(todayISO())
      setNeverEnds(true)
      setEndDate("")
    }
  }, [open, editing])

  const scheduleConfig: ScheduleConfig = {
    frequency: builder.frequency,
    interval: builder.interval,
    weekdays: builder.weekdays,
    dayOfMonth: builder.day_of_month,
    lastDayOfMonth: builder.last_day_of_month,
    startDate: new Date(startDate),
    end_date: neverEnds ? null : endDate ? new Date(endDate) : null,
    never_ends: neverEnds,
  }

  const handleSubmit = async () => {
    if (!name || !amount || !categoryName) {
      toast({ title: "Missing fields", description: "Name, amount and category are required." })
      return
    }
    const payload: CreateRecurringInput = {
      name,
      description,
      amount: Number(amount),
      type,
      category_name: categoryName,
      account: account || null,
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
        await updateRecurring.mutateAsync({ id: editing.id, data: payload })
        toast({ title: "Rule updated", description: `${name} was updated.` })
      } else {
        await createRecurring.mutateAsync(payload)
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

  const isSubmitting = createRecurring.isPending || updateRecurring.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Recurring Transaction" : "New Recurring Transaction"}</DialogTitle>
          <DialogDescription>
            Automate regular {type === "income" ? "income" : "expense"} entries on a schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rr-name">Title</Label>
              <Input id="rr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Rent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rr-amount">Amount (₹)</Label>
              <Input
                id="rr-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RecurringType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableCategoryInput
                value={categoryName}
                onValueChange={setCategoryName}
                type={type}
                placeholder="Select or type a category"
              />
            </div>
            <div className="space-y-2">
              <Label>Account (optional)</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rr-notes">Notes</Label>
            <Textarea
              id="rr-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
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
              <Label htmlFor="rr-start">Start Date</Label>
              <Input id="rr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch checked={neverEnds} onCheckedChange={setNeverEnds} id="rr-never" />
                <Label htmlFor="rr-never">Never ends</Label>
              </div>
              {!neverEnds && (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="rr-end">End Date</Label>
                  <Input id="rr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}
            </div>
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
