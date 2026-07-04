"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useSWRMonthlyStats } from "@/hooks/use-transactions-swr"
import { TrendingUp, BarChart3, Activity } from "lucide-react"

type ChartType = "bar" | "line"

export function MonthlyChart() {
  const { data, isLoading } = useSWRMonthlyStats(6)
  const [chartType, setChartType] = useState<ChartType>("bar")

  const chartData = data && Array.isArray(data) ? data.map((d: any) => ({
    month: d.month,
    income: d.income,
    expenses: d.expense,
    savings: d.net,
  })) : []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold text-foreground">
                ₹{Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant={chartType === "bar" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Bar
            </Button>
            <Button
              variant={chartType === "line" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setChartType("line")}
            >
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              Trend
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "bar" ? (
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="" vertical={false} stroke="currentColor" className="text-muted-foreground/20" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "currentColor", className: "text-muted-foreground/5" }} />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="" vertical={false} stroke="currentColor" className="text-muted-foreground/20" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Income"
                  dot={{ r: 4, strokeWidth: 2, fill: "#10b981" }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Expenses"
                  dot={{ r: 4, strokeWidth: 2, fill: "#ef4444" }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: "#ef4444" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
