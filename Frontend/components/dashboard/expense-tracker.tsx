"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"

interface Expense {
  id: number
  date: string
  category: string
  amount: number
  note: string
}

const categories = ["Food & Dining", "Transportation", "Shopping", "Entertainment", "Bills", "Healthcare", "Other"]

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, date: "2024-12-12", category: "Food & Dining", amount: 2450, note: "Grocery shopping" },
    { id: 2, date: "2024-12-11", category: "Transportation", amount: 320, note: "Uber ride to office" },
    { id: 3, date: "2024-12-10", category: "Entertainment", amount: 649, note: "Netflix subscription" },
    { id: 4, date: "2024-12-09", category: "Food & Dining", amount: 180, note: "Coffee shop" },
  ])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({})
  const [isAdding, setIsAdding] = useState(false)

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setNewExpense(expense)
  }

  const handleSave = () => {
    if (editingId) {
      setExpenses(expenses.map((exp) => (exp.id === editingId ? { ...exp, ...newExpense } : exp)))
      setEditingId(null)
    } else if (isAdding) {
      const id = Math.max(...expenses.map((e) => e.id)) + 1
      setExpenses([...expenses, { id, ...newExpense } as Expense])
      setIsAdding(false)
    }
    setNewExpense({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsAdding(false)
    setNewExpense({})
  }

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter((exp) => exp.id !== id))
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setNewExpense({ date: new Date().toISOString().split("T")[0] })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expense Tracker</CardTitle>
            <CardDescription>Track and manage your daily expenses</CardDescription>
          </div>
          <Button onClick={handleAddNew} disabled={isAdding || editingId !== null}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && (
                <TableRow>
                  <TableCell>
                    <Input
                      type="date"
                      value={newExpense.date || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newExpense.category || ""}
                      onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={newExpense.amount || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Note"
                      value={newExpense.note || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {editingId === expense.id ? (
                      <Input
                        type="date"
                        value={newExpense.date || expense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      />
                    ) : (
                      new Date(expense.date).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === expense.id ? (
                      <Select
                        value={newExpense.category || expense.category}
                        onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      expense.category
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === expense.id ? (
                      <Input
                        type="number"
                        value={newExpense.amount || expense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                      />
                    ) : (
                      `₹${expense.amount.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === expense.id ? (
                      <Input
                        value={newExpense.note || expense.note}
                        onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                      />
                    ) : (
                      expense.note
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === expense.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
