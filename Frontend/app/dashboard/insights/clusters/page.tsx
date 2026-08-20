"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Loader2,
  Users,
  BarChart3,
  CheckCircle2,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { toast } from "sonner"
import { mlApi, type ClustersResponse, type MerchantCluster } from "@/api/services"

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"]

export function ClustersPage() {
  const { openSidebar } = useDashboardSidebar()
  const [data, setData] = useState<ClustersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<"overview" | "clusters">("overview")

  const loadClusters = async () => {
    setLoading(true)
    try {
      const result = await mlApi.getClusters()
      setData(result)
    } catch (error) {
      console.error('Failed to load clusters', error)
      toast.error('Failed to load merchant clusters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClusters()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadClusters()
      toast.success('Clusters refreshed')
    } catch {
      toast.error('Failed to refresh clusters')
    } finally {
      setRefreshing(false)
    }
  }

  const clusterDistribution = data?.clusters?.reduce<Record<number, number>>((acc, c) => {
    acc[c.cluster] = (acc[c.cluster] || 0) + 1
    return acc
  }, {}) || {}

  const pieData = Object.entries(clusterDistribution).map(([cluster, count]) => ({
    name: `Cluster ${cluster}`,
    value: count,
  }))

  const topMerchants = [...(data?.clusters || [])]
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><Skeleton className="h-80 w-full" /></Card>
          <Card><Skeleton className="h-80 w-full" /></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Users className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merchant Clusters</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {data?.clusters?.length || 0} merchants segmented by spending behavior
            </p>
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

      {!data?.clusters?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No cluster data available</p>
            <p className="text-sm text-muted-foreground">Add more transactions to generate merchant clusters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "overview" | "clusters")}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clusters">Merchants</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Distribution</CardTitle>
                  <CardDescription>Number of merchants per cluster</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Merchants by Spend</CardTitle>
                  <CardDescription>Highest spending merchants across clusters</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topMerchants}>
                      <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                      <XAxis
                        dataKey="merchant"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        className="text-muted-foreground"
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Total Spend']} />
                      <Bar dataKey="total_spend" radius={[4, 4, 0, 0]}>
                        {topMerchants.map((entry) => (
                          <Cell key={entry.merchant} fill={COLORS[entry.cluster % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "clusters" && (
            <Card>
              <CardHeader>
                <CardTitle>All Merchants</CardTitle>
                <CardDescription>Complete merchant clustering breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Merchant</th>
                        <th className="text-right py-2 px-4">Total Spend</th>
                        <th className="text-right py-2 px-4">Avg Spend</th>
                        <th className="text-right py-2 px-4">Transactions</th>
                        <th className="text-center py-2 px-4">Cluster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clusters.map((merchant) => (
                        <tr key={merchant.merchant} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{merchant.merchant || 'Unknown'}</td>
                          <td className="text-right py-2 px-4">₹{merchant.total_spend.toLocaleString()}</td>
                          <td className="text-right py-2 px-4">₹{merchant.avg_spend.toLocaleString()}</td>
                          <td className="text-right py-2 px-4">{merchant.transaction_count}</td>
                          <td className="text-center py-2 px-4">
                            <Badge variant="secondary" style={{ backgroundColor: COLORS[merchant.cluster % COLORS.length] + '20', color: COLORS[merchant.cluster % COLORS.length] }}>
                              Cluster {merchant.cluster}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
