"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jul", income: 85000, expenses: 45000 },
  { month: "Aug", income: 85000, expenses: 48000 },
  { month: "Sep", income: 85000, expenses: 42000 },
  { month: "Oct", income: 85000, expenses: 46000 },
  { month: "Nov", income: 85000, expenses: 44000 },
  { month: "Dec", income: 85000, expenses: 42433 },
]

export function MonthlyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Breakdown</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
      </CardContent>
    </Card>
  )
}
