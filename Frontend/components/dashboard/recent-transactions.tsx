"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

const transactions = [
  {
    id: 1,
    type: "expense",
    description: "Grocery Shopping",
    category: "Food & Dining",
    amount: -2450,
    date: "Dec 12, 2024",
    status: "completed",
  },
  {
    id: 2,
    type: "income",
    description: "Salary Credit",
    category: "Income",
    amount: 85000,
    date: "Dec 10, 2024",
    status: "completed",
  },
  {
    id: 3,
    type: "expense",
    description: "Uber Ride",
    category: "Transportation",
    amount: -320,
    date: "Dec 11, 2024",
    status: "completed",
  },
  {
    id: 4,
    type: "expense",
    description: "Netflix Subscription",
    category: "Entertainment",
    amount: -649,
    date: "Dec 9, 2024",
    status: "pending",
  },
  {
    id: 5,
    type: "expense",
    description: "Coffee Shop",
    category: "Food & Dining",
    amount: -180,
    date: "Dec 8, 2024",
    status: "completed",
  },
]

export function RecentTransactions() {
  return (
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "income" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{transaction.description}</h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.category}</p>
                    <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    transaction.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : ""}₹{Math.abs(transaction.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
