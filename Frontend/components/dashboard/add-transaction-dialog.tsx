"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCreateTransaction } from "@/hooks"
import { toast } from "@/hooks/use-toast"

interface AddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTransactionDialog({ isOpen, onClose }: AddTransactionDialogProps) {
  const createMutation = useCreateTransaction()

  const [account, setAccount] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'income' | 'expense'>('expense')

  const handleSubmit = async (e?: any) => {
    e?.preventDefault()
    try {
      await createMutation.mutateAsync({ account, date, description, category, amount, type })
      toast({ title: 'Transaction added', description: 'Transaction was created successfully.' })
      onClose()
    } catch (err: any) {
      toast({ title: 'Failed to add transaction', description: err?.response?.data?.detail || err?.message || 'Please try again.' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <div>
            <Label>Account</Label>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account id" />
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>

          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          </div>

          <div>
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={createMutation.isLoading}>{createMutation.isLoading ? 'Adding...' : 'Add Transaction'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
