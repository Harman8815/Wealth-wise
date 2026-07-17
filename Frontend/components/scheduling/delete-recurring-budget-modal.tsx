"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useDeleteRecurringBudget, useRecurringBudgetExecutions } from "@/hooks/use-recurring-budgets"
import { toast } from "@/hooks/use-toast"
import type { RecurringBudget } from "@/api/services"

interface DeleteRecurringBudgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: RecurringBudget | null
}

export function DeleteRecurringBudgetModal({ open, onOpenChange, rule }: DeleteRecurringBudgetModalProps) {
  const deleteBudget = useDeleteRecurringBudget()
  const { data: executionsData } = useRecurringBudgetExecutions(rule?.id || "", 1, 1)

  if (!rule) return null

  const linkedCount = executionsData?.count ?? 0

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(rule.id)
      toast({ title: "Rule deleted", description: `${rule.name} and its future budgets were removed.` })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err?.response?.data?.detail || err?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Delete recurring budget?
          </DialogTitle>
          <DialogDescription>
            This will permanently remove <span className="font-semibold">{rule.name}</span> and stop all
            future scheduled budget generations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{rule.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next generation</span>
            <span className="font-medium">
              {rule.next_generation_date ? new Date(rule.next_generation_date).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budgets generated</span>
            <span className="font-medium">{rule.generation_count}</span>
          </div>
          {linkedCount > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              {linkedCount} generation record(s) are linked. Already-generated budgets remain in your
              history.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteBudget.isPending}>
            {deleteBudget.isPending ? "Deleting…" : "Delete Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
