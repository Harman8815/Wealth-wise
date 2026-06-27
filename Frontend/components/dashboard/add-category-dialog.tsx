"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCreateBudgetCategory } from "@/hooks"
import { toast } from "@/hooks/use-toast"

const categories = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Healthcare", "Income"]

const colorOptions = ["#f97316", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#ef4444", "#22c55e", "#6b7280"]

interface AddCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddCategoryDialog({ isOpen, onClose }: AddCategoryDialogProps) {
  const createMutation = useCreateBudgetCategory()
  const [name, setName] = useState("")
  const [budgeted, setBudgeted] = useState("")
  const [color, setColor] = useState(colorOptions[0])

  const handleSubmit = async (e?: any) => {
    e?.preventDefault()
    if (!name || !budgeted) {
      toast({ title: "Missing fields", description: "Please fill in all required fields" })
      return
    }
    try {
      await createMutation.mutateAsync({ name, budgeted: Number(budgeted), color })
      toast({ title: "Category added", description: "Budget category was created successfully." })
      onClose()
      setName("")
      setBudgeted("")
      setColor(colorOptions[0])
    } catch (err: any) {
      toast({ title: "Failed to add category", description: err?.response?.data?.detail || err?.message || "Please try again." })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Budget Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger id="name">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgeted">Budgeted Amount</Label>
            <Input id="budgeted" type="number" value={budgeted} onChange={(e) => setBudgeted(e.target.value)} placeholder="₹0.00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-black dark:border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding..." : "Add Category"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}