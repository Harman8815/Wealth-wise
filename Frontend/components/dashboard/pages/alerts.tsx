"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Menu, Bell, AlertTriangle, CheckCircle, Info, Settings, Trash2, Calendar } from "lucide-react"
import { useAlerts, useAlertSettings, useMarkAlertRead, useMarkAllAlertsRead, useToggleAlertSetting } from "@/hooks"
import { useSidebar } from "@/contexts/sidebar-context"

export function AlertsPage() {
  const { setIsSidebarOpen } = useSidebar()
  const [activeTab, setActiveTab] = useState("all")
  const { data: alertsData, isLoading: isLoadingAlerts } = useAlerts()
  const { data: settingsData, isLoading: isLoadingSettings } = useAlertSettings()
  const markAlertRead = useMarkAlertRead()
  const markAllRead = useMarkAllAlertsRead()
  const toggleSetting = useToggleAlertSetting()

  const alerts = alertsData?.results || []
  const alertSettings = settingsData?.results || []

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !alert.read
    return alert.type === activeTab
  })

  const unreadCount = alerts.filter((a) => !a.read).length

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  const handleToggleSetting = (id: string) => {
    toggleSetting.mutate(id)
  }

  if (isLoadingAlerts || isLoadingSettings) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 h-96">
            <Skeleton className="h-full" />
          </Card>
          <Card className="h-96">
            <Skeleton className="h-full" />
          </Card>
        </div>
      </div>
    )
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

  const getAlertBgColor = (type: string, read: boolean) => {
    const opacity = read ? "50" : "100"
    switch (type) {
      case "warning":
        return `bg-yellow-${opacity} dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800`
      case "error":
        return `bg-red-${opacity} dark:bg-red-950 border-red-200 dark:border-red-800`
      case "success":
        return `bg-green-${opacity} dark:bg-green-950 border-green-200 dark:border-green-800`
      case "info":
        return `bg-blue-${opacity} dark:bg-blue-950 border-blue-200 dark:border-blue-800`
      default:
        return `bg-gray-${opacity} dark:bg-gray-950 border-gray-200 dark:border-gray-800`
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

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Alerts & Notifications
                {unreadCount > 0 && <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Stay informed about your financial activity</p>
            </div>
          </div>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-8 space-y-6 w-full animate-fade-in">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-500" />
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{alerts.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Unread
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{alerts.length - unreadCount}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acknowledged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-500" />
                Active Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{alertSettings.filter((s) => s.enabled).length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Your latest notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertBgColor(alert.type, alert.read)} ${
                    !alert.read ? "border-l-4" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-semibold ${!alert.read ? "font-bold" : ""}`}>{alert.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                          {!alert.read && <Badge className="bg-blue-500 text-white text-xs">New</Badge>}
                        </div>
                        <p
                          className={`text-sm ${alert.read ? "text-gray-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}
                        >
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
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
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Settings</CardTitle>
            <CardDescription>Configure when and how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {alertSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium">{setting.title}</h3>
                      <Badge variant="outline">{setting.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{setting.description}</p>
                    {setting.threshold && setting.enabled && (
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
                        <span className="text-xs text-gray-500">{setting.id.includes("budget") ? "%" : "₹"}</span>
                      </div>
                    )}
                  </div>
                  <Switch 
                    checked={setting.enabled} 
                    onCheckedChange={() => handleToggleSetting(setting.id)} 
                    disabled={toggleSetting.isPending}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
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
                disabled={markAllRead.isPending}
              >
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-sm">Mark All Read</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                <Trash2 className="w-6 h-6 text-red-500" />
                <span className="text-sm">Clear All</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                <Calendar className="w-6 h-6 text-blue-500" />
                <span className="text-sm">Schedule Report</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
                <Settings className="w-6 h-6 text-purple-500" />
                <span className="text-sm">Advanced Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
