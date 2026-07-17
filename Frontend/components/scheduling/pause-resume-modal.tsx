"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PauseCircle, PlayCircle } from "lucide-react"
import { usePauseRecurring, useResumeRecurring } from "@/hooks/use-recurring"
import { toast } from "@/hooks/use-toast"
import type { RecurringRule } from "@/api/services"

interface PauseResumeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: RecurringRule | null
  /** When true, the dialog confirms resuming; otherwise it confirms pausing. */
  resume?: boolean
}

/**
 * Reusable confirmation dialog to temporarily disable or re-enable a recurring
 * rule without deleting it.
 */
export function PauseResumeModal({ open, onOpenChange, rule, resume = false }: PauseResumeModalProps) {
  const pause = usePauseRecurring()
  const resumeMut = useResumeRecurring()

  if (!rule) return null

  const mutation = resume ? resumeMut : pause
  const isPending = mutation.isPending

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(rule.id)
      toast({
        title: resume ? "Rule resumed" : "Rule paused",
        description: `${rule.name} is now ${resume ? "active" : "paused"}.`,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Action failed",
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
            {resume ? (
              <PlayCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <PauseCircle className="h-5 w-5 text-yellow-500" />
            )}
            {resume ? "Resume" : "Pause"} recurring rule?
          </DialogTitle>
          <DialogDescription>
            {resume
              ? `${rule.name} will resume generating scheduled transactions from its next due date.`
              : `${rule.name} will stop generating transactions until you resume it. No data is lost.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={resume ? "default" : "secondary"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Working…" : resume ? "Resume Rule" : "Pause Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
