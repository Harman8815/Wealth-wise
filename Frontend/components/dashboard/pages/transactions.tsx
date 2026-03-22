"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Menu, Search, Download, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: number
  date: string
  description: string
  category: string
  amount: number
  type: "income" | "expense"
  status: "completed" | "pending"
  account: string
}

export function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const [transactions] = useState<Transaction[]>([
    {
      id: 1,
      date: "2024-12-12",
      description: "Grocery Shopping - Big Bazaar",
      category: "Food & Dining",
      amount: -2450,
      type: "expense",
      status: "completed",
      account: "HDFC Bank",
    },
    {
      id: 2,
      date: "2024-12-10",
      description: "Salary Credit",
      category: "Income",
      amount: 85000,
      type: "income",
      status: "completed",
      account: "HDFC Bank",
    },
    {
      id: 3,
      date: "2024-12-11",
      description: "Uber Ride to Office",
      category: "Transportation",
      amount: -320,
      type: "expense",
      status: "completed",
      account: "Credit Card",
    },
    {
      id: 4,
      date: "2024-12-09",
      description: "Netflix Subscription",
      category: "Entertainment",
      amount: -649,
      type: "expense",
      status: "pending",
      account: "Credit Card",
    },
    {
      id: 5,
      date: "2024-12-08",
      description: "Coffee Shop - Starbucks",
      category: "Food & Dining",
      amount: -180,
      type: "expense",
      status: "completed",
      account: "Debit Card",
    },
    {
      id: 6,
      date: "2024-12-07",
      description: "Freelance Payment",
      category: "Income",
      amount: 15000,
      type: "income",
      status: "completed",
      account: "HDFC Bank",
    },
    {
      id: 7,
      date: "2024-12-06",
      description: "Electricity Bill",
      category: "Bills & Utilities",
      amount: -2100,
      type: "expense",
      status: "completed",
      account: "HDFC Bank",
    },
    {
      id: 8,
      date: "2024-12-05",
      description: "Amazon Shopping",
      category: "Shopping",
      amount: -3200,
      type: "expense",
      status: "completed",
      account: "Credit Card",
    },
    {
      id: 9,
      date: "2024-12-04",
      description: "Gym Membership",
      category: "Healthcare",
      amount: -1500,
      type: "expense",
      status: "completed",
      account: "HDFC Bank",
    },
    {
      id: 10,
      date: "2024-12-03",
      description: "Movie Tickets",
      category: "Entertainment",
      amount: -800,
      type: "expense",
      status: "completed",
      account: "Credit Card",
    },
  ])

  const categories = [
    "all",
    "Food & Dining",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills & Utilities",
    "Healthcare",
    "Income",
  ]

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || transaction.category === filterCategory
      const matchesType = filterType === "all" || transaction.type === filterType

      return matchesSearch && matchesCategory && matchesType
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "amount") return Math.abs(b.amount) - Math.abs(a.amount)
      return 0
    })

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage all your transactions</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

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
                className={`text-3xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ₹{(totalIncome - totalExpenses).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
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

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
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
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
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
                      <TableCell className="text-gray-600 dark:text-gray-400">{transaction.account}</TableCell>
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
                          {transaction.type === "income" ? "+" : ""}₹{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
