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
import { useDeleteRecurring, useRecurringExecutions } from "@/hooks/use-recurring"
import { toast } from "@/hooks/use-toast"
import type { RecurringRule } from "@/api/services"

interface DeleteRecurringModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: RecurringRule | null
}

export function DeleteRecurringModal({ open, onOpenChange, rule }: DeleteRecurringModalProps) {
  const deleteRecurring = useDeleteRecurring()
  const { data: executionsData } = useRecurringExecutions(rule?.id || "", 1, 1)

  if (!rule) return null

  const linkedCount = executionsData?.count ?? 0

  const handleDelete = async () => {
    try {
      await deleteRecurring.mutateAsync(rule.id)
      toast({ title: "Rule deleted", description: `${rule.name} and its future schedules were removed.` })
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
            Delete recurring rule?
          </DialogTitle>
          <DialogDescription>
            This will permanently remove <span className="font-semibold">{rule.name}</span> and stop all
            future scheduled transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{rule.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next execution</span>
            <span className="font-medium">
              {rule.next_execution_date
                ? new Date(rule.next_execution_date).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Past executions</span>
            <span className="font-medium">{rule.execution_count}</span>
          </div>
          {linkedCount > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              {linkedCount} execution record(s) are linked. Already-generated transactions remain in
              your history.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteRecurring.isPending}>
            {deleteRecurring.isPending ? "Deleting…" : "Delete Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
