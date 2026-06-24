"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useSWRMonthlyStats } from "@/hooks/use-transactions-swr"

export function MonthlyChart() {
  const { data, isLoading } = useSWRMonthlyStats(6)

  const chartData = data && Array.isArray(data) ? data.map((d: any) => ({ month: d.month, income: d.income, expenses: d.expense })) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Breakdown</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading chart...</div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
