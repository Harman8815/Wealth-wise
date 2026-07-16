"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { queryKeys } from "@/api/query-client"
import type { Alert as AlertType, AlertSetting } from "@/api/services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Menu,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Trash2,
  Calendar,
  CheckCheck,
  RefreshCw,
  Inbox,
  Sparkles,
} from "lucide-react"
import {
  useAlerts,
  useAlertSettings,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useToggleAlertSetting,
} from "@/hooks"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"

const ALERT_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "warning", label: "Warnings" },
  { id: "info", label: "Info" },
  { id: "success", label: "Success" },
  { id: "error", label: "Errors" },
] as const

const CATEGORY_ORDER: Record<string, number> = {
  Budget: 0,
  Bills: 1,
  Goals: 2,
  Security: 3,
  Account: 4,
  Investments: 5,
}

export function AlertsPage() {
  const { openSidebar } = useDashboardSidebar()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    data: alertsData,
    isLoading: isLoadingAlerts,
    isError: isAlertsError,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAlerts()
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useAlertSettings()
  const markAlertRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const toggleSetting = useToggleAlertSetting()

  const alerts = alertsData?.results ?? []
  const alertSettings = settingsData?.results ?? []

  const filteredAlerts = alerts.filter((alert: AlertType) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !alert.read
    return alert.type === activeTab
  })

  const unreadCount = alerts.filter((a: AlertType) => !a.read).length
  const readCount = alerts.length - unreadCount

  const groupedAlerts = Object.entries(
    filteredAlerts.reduce<Record<string, AlertType[]>>((acc, alert) => {
      const cat = alert.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(alert)
      return acc
    }, {}),
  ).sort(([a], [b]) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99))

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  const handleToggleSetting = (id: string) => {
    toggleSetting.mutate(id)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await apiClient.post<{ generated: number }>("/alerts/generate/")
      await queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unreadCount })
    } finally {
      setIsGenerating(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  if (isLoadingAlerts || isLoadingSettings) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    )
  }

  if (isAlertsError) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Could not load alerts</AlertTitle>
          <AlertDescription>
            {(alertsError as Error)?.message ?? "An unexpected error occurred."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => refetchAlerts()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Alerts & Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay informed about your financial activity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              Generate
            </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/notifications/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Notification Settings
                </Link>
              </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <Bell className="w-4 h-4 mr-2 text-blue-500" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{alerts.length}</div>
              <p className="text-xs text-gray-500">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                Unread
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
              <p className="text-xs text-gray-500">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{readCount}</div>
              <p className="text-xs text-gray-500">Acknowledged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <Settings className="w-4 h-4 mr-2 text-purple-500" />
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {alertSettings.filter((s: AlertSetting) => s.enabled).length}
              </div>
              <p className="text-xs text-gray-500">Monitoring</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {ALERT_TABS.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === "unread" && unreadCount > 0 && (
                  <Badge className="ml-2 bg-white/20 text-white">{unreadCount}</Badge>
                )}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Your latest notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-950 text-green-600 mb-4">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  You&apos;re all caught up
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mt-1">
                  No {activeTab === "all" ? "" : activeTab} alerts right now. We&apos;ll
                  notify you here when something needs your attention.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedAlerts.map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {category}
                      </h3>
                      <div className="h-px flex-1 bg-border/60" />
                      <Badge variant="outline" className="text-[10px]">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {items.map((alert: AlertType) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border bg-card transition-opacity ${
                            alert.read ? "opacity-70" : "border-l-4"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              {getAlertIcon(alert.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3
                                    className={`font-semibold truncate ${
                                      !alert.read ? "text-gray-900 dark:text-white" : ""
                                    }`}
                                  >
                                    {alert.title}
                                  </h3>
                                  {!alert.read && (
                                    <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                                  )}
                                </div>
                                <p
                                  className={`text-sm ${
                                    alert.read
                                      ? "text-gray-600 dark:text-gray-400"
                                      : "text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {formatTimestamp(alert.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {!alert.read && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAlertRead.mutate(alert.id)}
                                  disabled={markAlertRead.isPending}
                                >
                                  Mark Read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Settings</CardTitle>
            <CardDescription>
              Configure when and how you receive notifications.{" "}
              <Link
                href="/dashboard/notifications"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Manage all categories
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSettingsError ? (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Could not load settings</AlertTitle>
                <AlertDescription>
                  {(settingsError as Error)?.message ?? "An unexpected error occurred."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {alertSettings.map((setting: AlertSetting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{setting.title}</h3>
                        <Badge variant="outline">{setting.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {setting.description}
                      </p>
                      {setting.threshold != null && setting.enabled && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`threshold-${setting.id}`} className="text-xs">
                            Threshold:
                          </Label>
                          <Input
                            id={`threshold-${setting.id}`}
                            type="number"
                            value={setting.threshold}
                            disabled
                            className="w-24 h-8 text-xs"
                          />
                          <span className="text-xs text-gray-500">
                            {setting.threshold_unit ?? ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={() => handleToggleSetting(setting.id)}
                      disabled={toggleSetting.isPending}
                      aria-label={`Toggle ${setting.title}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common alert management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending || unreadCount === 0}
              >
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-sm">Mark All Read</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles className={`w-6 h-6 text-purple-500 ${isGenerating ? "animate-spin" : ""}`} />
                <span className="text-sm">Generate Alerts</span>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                <Link href="/dashboard/notifications">
                  <Calendar className="w-6 h-6 text-blue-500" />
                  <span className="text-sm">Manage Settings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent" disabled>
                <Trash2 className="w-6 h-6 text-red-500" />
                <span className="text-sm">Clear All</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
