"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/scheduling/status-badge"
import { EmptyState } from "@/components/scheduling/empty-state"
import { RecurringBudgetFormModal } from "@/components/scheduling/recurring-budget-form-modal"
import { DeleteRecurringBudgetModal } from "@/components/scheduling/delete-recurring-budget-modal"
import { PauseResumeBudgetModal } from "@/components/scheduling/pause-resume-budget-modal"
import { RecurringBudgetUpcomingModal } from "@/components/scheduling/recurring-budget-upcoming-modal"
import {
  Repeat,
  Plus,
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  Zap,
  CalendarClock,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useRecurringBudgets,
  useGenerateRecurringBudgetNow,
  useRunDueRecurringBudgets,
} from "@/hooks/use-recurring-budgets"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import type { RecurringBudget } from "@/api/services"

export function RecurringBudgetPage() {
  const { openSidebar } = useDashboardSidebar()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringBudget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringBudget | null>(null)
  const [pauseTarget, setPauseTarget] = useState<RecurringBudget | null>(null)
  const [upcomingTarget, setUpcomingTarget] = useState<RecurringBudget | null>(null)

  const { data, isLoading } = useRecurringBudgets()
  const generateNow = useGenerateRecurringBudgetNow()
  const runDue = useRunDueRecurringBudgets()
  const rules = data?.results || []

  const filtered = rules.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }
  const openEdit = (rule: RecurringBudget) => {
    setEditing(rule)
    setIsFormOpen(true)
  }
  const openDuplicate = (rule: RecurringBudget) => {
    const clone: RecurringBudget = {
      ...rule,
      id: "",
      name: `${rule.name} (copy)`,
      status: "active",
      generation_count: 0,
      last_generation_date: null,
      next_generation_date: null,
    }
    setEditing(clone)
    setIsFormOpen(true)
  }

  const upcoming = filtered
    .filter((r) => r.status === "active" && r.next_generation_date)
    .sort(
      (a, b) =>
        new Date(a.next_generation_date!).getTime() - new Date(b.next_generation_date!).getTime()
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Repeat className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Recurring Budgets</h1>
            <p className="text-sm text-muted-foreground">Automate periodic budgets without manual setup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => runDue.mutate()} disabled={runDue.isPending}>
            <Zap className="mr-2 h-4 w-4" />
            {runDue.isPending ? "Processing…" : "Process Due"}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </Button>
        </div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        {upcoming.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                Upcoming Budget Generations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 6).map((r) => (
                <UpcomingRow key={r.id} rule={r} onView={() => setUpcomingTarget(r)} />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recurring budgets…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Repeat className="h-10 w-10" />}
            title="No recurring budgets yet"
            description="Create a rule to automatically generate your monthly or periodic budgets — no more recreating them by hand."
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> New Recurring Budget
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => openEdit(rule)}
                onDuplicate={() => openDuplicate(rule)}
                onDelete={() => setDeleteTarget(rule)}
                onPause={() => setPauseTarget(rule)}
                onGenerate={() => generateNow.mutate(rule.id)}
                onUpcoming={() => setUpcomingTarget(rule)}
                isGenerating={generateNow.isPending}
              />
            ))}
          </div>
        )}
      </main>

      <RecurringBudgetFormModal open={isFormOpen} onOpenChange={setIsFormOpen} editing={editing} />
      <DeleteRecurringBudgetModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        rule={deleteTarget}
      />
      {pauseTarget && (
        <PauseResumeBudgetModal
          open={!!pauseTarget}
          onOpenChange={(o) => !o && setPauseTarget(null)}
          rule={pauseTarget}
          resume={pauseTarget.status === "paused"}
        />
      )}
      <RecurringBudgetUpcomingModal
        open={!!upcomingTarget}
        onOpenChange={(o) => !o && setUpcomingTarget(null)}
        rule={upcomingTarget}
      />
    </div>
  )
}

function UpcomingRow({ rule, onView }: { rule: RecurringBudget; onView: () => void }) {
  return (
    <button
      onClick={onView}
      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <Repeat className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{rule.name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(rule.next_generation_date!).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <p className="text-sm font-semibold text-blue-600">₹{Number(rule.total_budget).toLocaleString()}</p>
    </button>
  )
}

function RuleCard({
  rule,
  onEdit,
  onDuplicate,
  onDelete,
  onPause,
  onGenerate,
  onUpcoming,
  isGenerating,
}: {
  rule: RecurringBudget
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPause: () => void
  onGenerate: () => void
  onUpcoming: () => void
  isGenerating: boolean
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Repeat className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{rule.name}</p>
              <StatusBadge status={rule.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-blue-600">₹{Number(rule.total_budget).toLocaleString()}</span>
              <span>{rule.categories.length} categor{rule.categories.length === 1 ? "y" : "ies"}</span>
              <span className="capitalize">{rule.frequency}</span>
              {rule.status !== "completed" && (
                <button onClick={onUpcoming} className="text-blue-500 hover:underline">
                  View upcoming
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Next:{" "}
                {rule.next_generation_date
                  ? new Date(rule.next_generation_date).toLocaleDateString()
                  : "—"}
              </span>
              <span>
                Last: {rule.last_generation_date ? new Date(rule.last_generation_date).toLocaleDateString() : "Never"}
              </span>
              <span>· {rule.generation_count} generated</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating || rule.status === "completed"}>
            <Zap className="mr-1 h-3.5 w-3.5" /> Run now
          </Button>
          {rule.status !== "completed" && (
            <Button variant="outline" size="sm" onClick={onPause}>
              {rule.status === "paused" ? (
                <>
                  <Play className="mr-1 h-3.5 w-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplicate">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
