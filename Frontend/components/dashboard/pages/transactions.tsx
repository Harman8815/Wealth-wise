"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Menu, Search, Plus, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, X, Eye, Pencil, Trash2, History } from "lucide-react"
import { useTransactions, useTransactionSummary, useUpdateTransaction, useDeleteTransaction, useTransactionHistory } from "@/hooks"
import { AddTransactionDialog } from "../add-transaction-dialog"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { Transaction } from "@/api/services"
import { toast } from "@/hooks/use-toast"

const PAGE_SIZE = 10

export function TransactionsPage() {
  const { openSidebar } = useDashboardSidebar()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [sortField, setSortField] = useState<"date" | "amount">("date")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const ordering = `${sortDirection === 'desc' ? '-' : ''}${sortField}`

  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions(
    {
      category: filterCategory === "all" ? undefined : filterCategory,
      type: filterType === "all" ? undefined : filterType,
      search: searchTerm.trim() || undefined,
      ordering,
    },
    page,
    PAGE_SIZE
  )
  const { data: summary, isLoading: isLoadingSummary } = useTransactionSummary()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()
  const { data: history, isLoading: isLoadingHistory } = useTransactionHistory(viewTransaction?.id || "")

  const transactions = transactionsData?.results || []
  const totalCount = transactionsData?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasNextPage = transactionsData?.next !== null && transactionsData?.next !== undefined
  const hasPrevPage = transactionsData?.previous !== null && transactionsData?.previous !== undefined

  const totalIncome = summary?.income || 0
  const totalExpenses = summary?.expense || 0
  const netFlow = summary?.net || 0

  const categories = ["all", "Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Healthcare", "Income"]

  const hasActiveFilters = searchTerm.trim() !== "" || filterCategory !== "all" || filterType !== "all"

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterCategory("all")
    setFilterType("all")
    setPage(1)
  }

  const editCategories = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Healthcare", "Income"]

  const handleEdit = async (data: { date: string; description: string; category: string; amount: number; type: "income" | "expense" }) => {
    if (!viewTransaction) return
    try {
      await updateMutation.mutateAsync({ id: viewTransaction.id, data })
      toast({ title: "Transaction updated", description: "Transaction was updated successfully." })
      setIsEditOpen(false)
      setViewTransaction(null)
    } catch (err: any) {
      toast({ title: "Failed to update transaction", description: err?.response?.data?.detail || err?.message || "Please try again." })
    }
  }

  const handleDelete = async () => {
    if (!viewTransaction) return
    if (!confirm("Are you sure you want to delete this transaction?")) return
    try {
      await deleteMutation.mutateAsync(viewTransaction.id)
      toast({ title: "Transaction deleted", description: "Transaction was deleted successfully." })
      setViewTransaction(null)
    } catch (err: any) {
      toast({ title: "Failed to delete transaction", description: err?.response?.data?.detail || err?.message || "Please try again." })
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage all your transactions</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

        <AddTransactionDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <Dialog open={!!viewTransaction} onOpenChange={(open) => !open && setViewTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Transaction</DialogTitle>
          </DialogHeader>
          {viewTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium">{viewTransaction.date}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={viewTransaction.status === "completed" ? "default" : "secondary"}>
                    {viewTransaction.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="text-sm font-medium">{viewTransaction.description}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="outline">{viewTransaction.category}</Badge>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant={viewTransaction.type === "income" ? "default" : "secondary"}>
                    {viewTransaction.type}
                  </Badge>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className={`font-semibold ${viewTransaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {viewTransaction.type === "income" ? "+" : "-"}₹{Number(viewTransaction.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Account</Label>
                  <p className="text-sm">{viewTransaction.account_name || "-"}</p>
                </div>
              </div>

              {/* Edit History */}
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <History className="w-4 h-4" />
                  <h3 className="font-medium">Edit History</h3>
                </div>
                {isLoadingHistory ? (
                  <Skeleton className="h-20 w-full" />
                ) : history && history.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {history.map((h) => (
                      <div key={h.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{h.field_name}</span>
                          <span className="text-gray-500">{new Date(h.changed_at).toLocaleString()}</span>
                        </div>
                        <div className="text-gray-600">
                          {h.old_value} → {h.new_value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No edit history available</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => { setIsEditOpen(true); setViewTransaction(null) }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isLoading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteMutation.isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditTransactionDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        transaction={viewTransaction}
        onSave={handleEdit}
        categories={editCategories}
      />

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">Net Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ₹{Math.abs(netFlow).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter Transactions</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>

              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(v) => { setFilterType(v as any); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value) => { setSortField(value as "date" | "amount"); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Showing {transactions.length} of {totalCount} transactions
            </CardDescription>
          </CardHeader>
<CardContent>
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>
                       <button
                         type="button"
                         className="inline-flex items-center gap-2 font-semibold"
                         onClick={() => {
                           if (sortField === 'date') {
                             setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
                           } else {
                             setSortField('date')
                             setSortDirection('desc')
                           }
                         }}
                       >
                         Date
                         <span>{sortField === 'date' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}</span>
                       </button>
                     </TableHead>
                     <TableHead>Description</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Account</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">
                       <button
                         type="button"
                         className="inline-flex items-center gap-2 font-semibold"
                         onClick={() => {
                           if (sortField === 'amount') {
                             setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
                           } else {
                             setSortField('amount')
                             setSortDirection('desc')
                           }
                         }}
                       >
                         Amount
                         <span>{sortField === 'amount' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}</span>
                       </button>
                     </TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {isLoadingTransactions ? (
                     [...Array(PAGE_SIZE)].map((_, i) => (
                       <TableRow key={i}>
                         <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                       </TableRow>
                     ))
                   ) : transactions.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                         No transactions found.
                       </TableCell>
                     </TableRow>
                   ) : (
                     transactions.map((transaction) => (
                       <TableRow key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                         <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                         <TableCell>
                           <div className="flex items-center space-x-3">
                             <div
                               className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                 transaction.type === "income"
                                   ? "bg-green-100 dark:bg-green-900"
                                   : "bg-red-100 dark:bg-red-900"
                               }`}
                             >
                               {transaction.type === "income" ? (
                                 <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
                               ) : (
                                 <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                               )}
                             </div>
                             <span className="font-medium">{transaction.description}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline">{transaction.category}</Badge>
                         </TableCell>
                         <TableCell className="text-gray-600 dark:text-gray-400">{transaction.account_name || "-"}</TableCell>
                         <TableCell>
                           <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                             {transaction.status}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <span
                             className={`font-semibold ${
                               transaction.type === "income"
                                 ? "text-green-600 dark:text-green-400"
                                 : "text-red-600 dark:text-red-400"
                             }`}
                           >
                             {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString()}
                           </span>
                         </TableCell>
                         <TableCell>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setViewTransaction(transaction)}
                           >
                             <Eye className="w-4 h-4" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     )))}
                 </TableBody>
               </Table>
             </div>

             {/* Pagination Controls */}
             <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
               <p className="text-sm text-gray-600 dark:text-gray-400">
                 Page {page} of {totalPages} · {totalCount} total transactions
               </p>
               <div className="flex items-center space-x-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setPage((p) => Math.max(1, p - 1))}
                   disabled={!hasPrevPage}
                 >
                   <ChevronLeft className="w-4 h-4 mr-1" />
                   Previous
                 </Button>
                 <div className="flex items-center space-x-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     let pageNum: number
                     if (totalPages <= 5) {
                       pageNum = i + 1
                     } else if (page <= 3) {
                       pageNum = i + 1
                     } else if (page >= totalPages - 2) {
                       pageNum = totalPages - 4 + i
                     } else {
                       pageNum = page - 2 + i
                     }
                     return (
                       <Button
                         key={pageNum}
                         variant={page === pageNum ? "default" : "outline"}
                         size="sm"
                         className="w-8 h-8 p-0"
                         onClick={() => setPage(pageNum)}
                       >
                         {pageNum}
                       </Button>
                     )
                   })}
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                   disabled={!hasNextPage}
                 >
                   Next
                   <ChevronRight className="w-4 h-4 ml-1" />
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </main>
     </div>
   )
}

interface EditTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSave: (data: { date: string; description: string; category: string; amount: number; type: "income" | "expense" }) => void
  categories: string[]
}

function EditTransactionDialog({ isOpen, onClose, transaction, onSave, categories }: EditTransactionDialogProps) {
  const [date, setDate] = useState(transaction?.date || "")
  const [description, setDescription] = useState(transaction?.description || "")
  const [category, setCategory] = useState(transaction?.category || "")
  const [amount, setAmount] = useState(transaction?.amount || 0)
  const [type, setType] = useState<"income" | "expense">(transaction?.type || "expense")

  const handleSubmit = (e?: any) => {
    e?.preventDefault()
    onSave({ date, description, category, amount, type })
  }

  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit">Save Transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

