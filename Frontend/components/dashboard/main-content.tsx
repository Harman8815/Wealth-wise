"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, Plus, Lightbulb, Calendar } from "lucide-react"
import { OverviewCards } from "./overview-cards"
import { RecentTransactions } from "./recent-transactions"
import { ExpenseTracker } from "./expense-tracker"
import { MonthlyChart } from "./monthly-chart"

interface MainContentProps {
  onMenuClick: () => void
}

export function MainContent({ onMenuClick }: MainContentProps) {
  return (
    <div className="flex-1 ">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, Alex 👋</h1>
              <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your money today</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
            <Button variant="outline">Generate Report</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Overview Cards */}
        <OverviewCards />

        {/* Charts and Tables Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          <MonthlyChart />

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                AI Insights
              </CardTitle>
              <CardDescription>Smart recommendations based on your spending patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Spending Alert</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You've spent 15% more on dining out this month compared to last month. Consider setting a dining
                  budget.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🎯 Savings Opportunity</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You could save ₹2,500 monthly by switching to a different subscription plan for your streaming
                  services.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">📈 Investment Tip</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Based on your savings pattern, consider investing ₹5,000 monthly in SIP for better returns.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions />

        {/* Expense Tracker */}
        <ExpenseTracker />

        {/* Upcoming Bills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Upcoming Bills & Reminders
            </CardTitle>
            <CardDescription>Don't miss these upcoming payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Electricity Bill", amount: "₹2,450", due: "Dec 15", status: "pending" },
                { name: "Internet Bill", amount: "₹899", due: "Dec 18", status: "pending" },
                { name: "Credit Card Payment", amount: "₹15,670", due: "Dec 20", status: "urgent" },
              ].map((bill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{bill.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due: {bill.due}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{bill.amount}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        bill.status === "urgent"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
