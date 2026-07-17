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
import { RecurringFormModal } from "@/components/scheduling/recurring-form-modal"
import { DeleteRecurringModal } from "@/components/scheduling/delete-recurring-modal"
import { PauseResumeModal } from "@/components/scheduling/pause-resume-modal"
import {
  Repeat,
  Plus,
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useRecurringRules,
  useGenerateRecurringNow,
  useRunDueRecurring,
} from "@/hooks/use-recurring"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import type { RecurringRule } from "@/api/services"

export function RecurringPage() {
  const { openSidebar } = useDashboardSidebar()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringRule | null>(null)
  const [pauseTarget, setPauseTarget] = useState<RecurringRule | null>(null)

  const { data, isLoading } = useRecurringRules()
  const generateNow = useGenerateRecurringNow()
  const runDue = useRunDueRecurring()
  const rules = data?.results || []

  const filtered = rules.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    if (typeFilter !== "all" && r.type !== typeFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }
  const openEdit = (rule: RecurringRule) => {
    setEditing(rule)
    setIsFormOpen(true)
  }

  const upcoming = filtered
    .filter((r) => r.status === "active" && r.next_execution_date)
    .sort(
      (a, b) =>
        new Date(a.next_execution_date!).getTime() - new Date(b.next_execution_date!).getTime()
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Repeat className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Recurring Transactions</h1>
            <p className="text-sm text-muted-foreground">Automate regular income and expenses</p>
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
        {/* Upcoming preview */}
        {upcoming.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                Upcoming Scheduled Executions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 6).map((r) => (
                <UpcomingRow key={r.id} rule={r} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recurring rules…"
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Repeat className="h-10 w-10" />}
            title="No recurring rules yet"
            description="Create a rule to automatically generate transactions on a schedule — rent, salary, subscriptions and more."
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> New Recurring Rule
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
                onDelete={() => setDeleteTarget(rule)}
                onPause={() => setPauseTarget(rule)}
                onGenerate={() => generateNow.mutate(rule.id)}
                isGenerating={generateNow.isPending}
              />
            ))}
          </div>
        )}
      </main>

      <RecurringFormModal open={isFormOpen} onOpenChange={setIsFormOpen} editing={editing} />
      <DeleteRecurringModal open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} rule={deleteTarget} />
      {pauseTarget && (
        <PauseResumeModal
          open={!!pauseTarget}
          onOpenChange={(o) => !o && setPauseTarget(null)}
          rule={pauseTarget}
          resume={pauseTarget.status === "paused"}
        />
      )}
    </div>
  )
}

function UpcomingRow({ rule }: { rule: RecurringRule }) {
  const isIncome = rule.type === "income"
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
            {new Date(rule.next_execution_date!).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", isIncome ? "text-emerald-600" : "text-rose-600")}>
        {isIncome ? "+" : "-"}₹{rule.amount.toLocaleString()}
      </p>
    </div>
  )
}

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onPause,
  onGenerate,
  isGenerating,
}: {
  rule: RecurringRule
  onEdit: () => void
  onDelete: () => void
  onPause: () => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  const isIncome = rule.type === "income"
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}
          >
            {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{rule.name}</p>
              <StatusBadge status={rule.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className={cn("font-semibold", isIncome ? "text-emerald-600" : "text-rose-600")}>
                {isIncome ? "+" : "-"}₹{rule.amount.toLocaleString()}
              </span>
              <span>{rule.category?.name || rule.category_name || "Uncategorized"}</span>
              <span className="capitalize">{rule.frequency}</span>
              {rule.account_name && <span>· {rule.account_name}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Next:{" "}
                {rule.next_execution_date
                  ? new Date(rule.next_execution_date).toLocaleDateString()
                  : "—"}
              </span>
              <span>
                Last: {rule.last_execution_date ? new Date(rule.last_execution_date).toLocaleDateString() : "Never"}
              </span>
              <span>· {rule.execution_count} run(s)</span>
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
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
