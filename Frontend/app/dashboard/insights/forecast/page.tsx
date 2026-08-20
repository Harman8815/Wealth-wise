"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  CheckCircle2,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { toast } from "sonner"
import { mlApi, type ForecastResponse } from "@/api/services"

type ForecastTab = "prophet" | "lstm" | "combined"

export default function ForecastPageRoute() {
  const { openSidebar } = useDashboardSidebar()
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<ForecastTab>("combined")

  const loadForecast = async () => {
    setLoading(true)
    try {
      const data = await mlApi.getForecast()
      setForecast(data)
    } catch (error) {
      console.error('Failed to load forecast', error)
      toast.error('Failed to load spending forecast')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadForecast()
      toast.success('Forecast refreshed')
    } catch {
      toast.error('Failed to refresh forecast')
    } finally {
      setRefreshing(false)
    }
  }

  const prophetData = forecast?.prophet?.map((p) => ({
    date: p.ds?.slice(5) || '',
    predicted: p.yhat,
    lower: p.yhat_lower,
    upper: p.yhat_upper,
  })) || []

  const lstmData = forecast?.lstm?.forecast?.map((val, idx) => ({
    day: `Day ${idx + 1}`,
    predicted: val,
  })) || []

  const csvData = forecast?.csv_data?.map((row: any) => ({
    date: row.date || row.ds || '',
    predicted: row.yhat || row.predicted || row.value || 0,
    actual: row.y || row.actual || 0,
  })) || []

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasData = prophetData.length > 0 || lstmData.length > 0 || csvData.length > 0

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <TrendingUp className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Spending Forecast</h1>
            <p className="text-gray-600 dark:text-gray-400">30-day spending prediction using ML models</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </header>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No forecast data available</p>
            <p className="text-sm text-muted-foreground">Add more transactions to generate forecasts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ForecastTab)}>
            <TabsList>
              {(Object.keys({ prophet: 'Prophet', lstm: 'LSTM', combined: 'Combined' }) as ForecastTab[]).map((t) => (
                <TabsTrigger key={t} value={t} className="capitalize">
                  {t === 'prophet' && <BarChart3 className="w-4 h-4 mr-2" />}
                  {t === 'lstm' && <TrendingUp className="w-4 h-4 mr-2" />}
                  {t === 'combined' && <Calendar className="w-4 h-4 mr-2" />}
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {(tab === "prophet" || tab === "combined") && prophetData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prophet Forecast</CardTitle>
                <CardDescription>30-day spending prediction with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={prophetData}>
                    <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                    <XAxis
                      dataKey="date"
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
                      tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Predicted']}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="upper"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="lower"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(tab === "lstm" || tab === "combined") && lstmData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>LSTM Forecast</CardTitle>
                <CardDescription>Deep learning-based spending prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={lstmData}>
                    <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                    <XAxis
                      dataKey="day"
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
                      tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Predicted']} />
                    <Bar dataKey="predicted" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {csvData.length > 0 && tab === "combined" && (
            <Card>
              <CardHeader>
                <CardTitle>Historical vs Forecast</CardTitle>
                <CardDescription>Comparison of actual vs predicted spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={csvData}>
                    <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                    <XAxis
                      dataKey="date"
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
                      tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString()}`,
                      name === 'predicted' ? 'Predicted' : 'Actual'
                    ]} />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} name="actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#ef4444" strokeWidth={2} dot={false} name="predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
