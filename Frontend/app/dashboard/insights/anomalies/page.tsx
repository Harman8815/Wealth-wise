"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RefreshCw, Loader2, CheckCircle2 } from "lucide-react"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { toast } from "sonner"
import { mlApi, type Anomaly } from "@/api/services"

export function AnomaliesPage() {
  const { openSidebar } = useDashboardSidebar()
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnomalies = async () => {
    setLoading(true)
    try {
      const data = await mlApi.getAnomalies()
      setAnomalies(data.anomalies)
    } catch (error) {
      console.error('Failed to load anomalies', error)
      toast.error('Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnomalies()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadAnomalies()
      toast.success('Anomalies refreshed')
    } catch {
      toast.error('Failed to refresh anomalies')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-40">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <AlertTriangle className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Anomalies</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {anomalies.length} anomalous transaction{anomalies.length !== 1 ? 's' : ''} detected
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

      {anomalies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">No anomalies detected</p>
            <p className="text-sm text-muted-foreground">Your transactions look normal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {anomalies.map((anomaly) => (
            <Card key={anomaly.transaction_id} className={anomaly.is_anomaly ? 'border-red-200 dark:border-red-800' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    {anomaly.is_anomaly ? 'Anomaly' : 'Suspicious'}
                  </CardTitle>
                  <Badge variant={anomaly.is_anomaly ? 'destructive' : 'secondary'}>
                    Score: {(anomaly.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-1">{anomaly.description}</p>
                <p className="text-lg font-bold">₹{anomaly.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">{anomaly.date}</p>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Threshold: {(anomaly.threshold * 100).toFixed(0)}%</span>
                    <span className={anomaly.is_anomaly ? 'text-red-500 font-medium' : ''}>
                      {anomaly.is_anomaly ? 'Flagged' : 'Review'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
