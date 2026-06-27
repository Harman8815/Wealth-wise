"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, ArrowDownLeft, Eye, Coffee, Car, Film, ShoppingCart, Zap, HeartPulse, DollarSign, ShoppingBag } from "lucide-react"
import { useSWRRecentTransactions } from "@/hooks/use-transactions-swr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const categoryIcons: Record<string, React.ReactNode> = {
  "Food & Dining": <Coffee className="w-5 h-5" />,
  "Transportation": <Car className="w-5 h-5" />,
  "Entertainment": <Film className="w-5 h-5" />,
  "Shopping": <ShoppingCart className="w-5 h-5" />,
  "Bills & Utilities": <Zap className="w-5 h-5" />,
  "Healthcare": <HeartPulse className="w-5 h-5" />,
  "Income": <DollarSign className="w-5 h-5" />,
}

const categoryColors: Record<string, { bg: string; icon: string }> = {
  "Food & Dining": { bg: "bg-orange-100 dark:bg-orange-900/50", icon: "text-orange-600 dark:text-orange-400" },
  "Transportation": { bg: "bg-blue-100 dark:bg-blue-900/50", icon: "text-blue-600 dark:text-blue-400" },
  "Entertainment": { bg: "bg-purple-100 dark:bg-purple-900/50", icon: "text-purple-600 dark:text-purple-400" },
  "Shopping": { bg: "bg-pink-100 dark:bg-pink-900/50", icon: "text-pink-600 dark:text-pink-400" },
  "Bills & Utilities": { bg: "bg-yellow-100 dark:bg-yellow-900/50", icon: "text-yellow-600 dark:text-yellow-400" },
  "Healthcare": { bg: "bg-red-100 dark:bg-red-900/50", icon: "text-red-600 dark:text-red-400" },
  "Income": { bg: "bg-green-100 dark:bg-green-900/50", icon: "text-green-600 dark:text-green-400" },
  "default": { bg: "bg-gray-100 dark:bg-gray-900/50", icon: "text-gray-600 dark:text-gray-400" },
}

export function RecentTransactions() {
  const { data: transactionsData, isLoading } = useSWRRecentTransactions(10)
  const [viewTransaction, setViewTransaction] = useState<any | null>(null)
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")

  let transactions = transactionsData?.results || []
  
  // Filter transactions by type
  if (filterType !== "all") {
    transactions = transactions.filter(t => t.type === filterType)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="mt-3">
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const categoryName = typeof transaction.category === 'object' ? transaction.category?.name : transaction.category
              const iconData = categoryColors[categoryName] || categoryColors.default
              const IconComponent = categoryIcons[categoryName] || <ShoppingBag className="w-5 h-5" />
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${iconData.bg}`}
                    >
                      <span className={iconData.icon}>{IconComponent}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{transaction.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setViewTransaction(transaction)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewTransaction} onOpenChange={(open) => !open && setViewTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {viewTransaction && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    viewTransaction.type === "income" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  }`}
                >
                  {viewTransaction.type === "income" ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-200" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{viewTransaction.description}</p>
                  <Badge variant="outline" className="text-xs">{typeof viewTransaction.category === 'object' ? viewTransaction.category?.name : viewTransaction.category}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Amount</p>
                  <p className={`font-semibold ${viewTransaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {viewTransaction.type === "income" ? "+" : "-"}₹{Number(viewTransaction.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-medium">{viewTransaction.date}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Account</p>
                  <p className="font-medium">{viewTransaction.account_name || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}