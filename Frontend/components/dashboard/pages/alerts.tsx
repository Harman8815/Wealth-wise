"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Menu, Bell, AlertTriangle, CheckCircle, Info, Settings, Trash2, Calendar } from "lucide-react"

interface Alert {
  id: number
  type: "warning" | "info" | "success" | "error"
  title: string
  message: string
  timestamp: string
  read: boolean
  category: string
}

interface AlertSetting {
  id: string
  title: string
  description: string
  enabled: boolean
  threshold?: number
  category: string
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: "warning",
      title: "Budget Limit Approaching",
      message: "You've spent 85% of your monthly budget. Consider reviewing your expenses.",
      timestamp: "2024-12-12T10:30:00Z",
      read: false,
      category: "Budget",
    },
    {
      id: 2,
      type: "info",
      title: "Bill Reminder",
      message: "Your electricity bill of ₹2,450 is due in 3 days.",
      timestamp: "2024-12-12T09:15:00Z",
      read: false,
      category: "Bills",
    },
    {
      id: 3,
      type: "success",
      title: "Goal Milestone Reached",
      message: "Congratulations! You've reached 60% of your Emergency Fund goal.",
      timestamp: "2024-12-11T16:45:00Z",
      read: true,
      category: "Goals",
    },
    {
      id: 4,
      type: "error",
      title: "Unusual Spending Detected",
      message: "Large transaction of ₹15,000 detected. Please verify if this was authorized.",
      timestamp: "2024-12-11T14:20:00Z",
      read: false,
      category: "Security",
    },
    {
      id: 5,
      type: "info",
      title: "Monthly Report Ready",
      message: "Your November financial report is now available for download.",
      timestamp: "2024-12-10T12:00:00Z",
      read: true,
      category: "Reports",
    },
  ])

  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    {
      id: "budget_warning",
      title: "Budget Warnings",
      description: "Get notified when you approach your budget limits",
      enabled: true,
      threshold: 80,
      category: "Budget",
    },
    {
      id: "bill_reminders",
      title: "Bill Reminders",
      description: "Receive reminders for upcoming bill payments",
      enabled: true,
      category: "Bills",
    },
    {
      id: "goal_milestones",
      title: "Goal Milestones",
      description: "Celebrate when you reach savings goal milestones",
      enabled: true,
      category: "Goals",
    },
    {
      id: "unusual_spending",
      title: "Unusual Spending",
      description: "Alert for transactions that seem out of pattern",
      enabled: true,
      threshold: 10000,
      category: "Security",
    },
    {
      id: "low_balance",
      title: "Low Balance Alerts",
      description: "Warning when account balance falls below threshold",
      enabled: false,
      threshold: 5000,
      category: "Account",
    },
    {
      id: "investment_updates",
      title: "Investment Updates",
      description: "Market updates and portfolio performance alerts",
      enabled: false,
      category: "Investments",
    },
  ])

  const unreadCount = alerts.filter((alert) => !alert.read).length

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

  const markAsRead = (id: number) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)))
  }

  const deleteAlert = (id: number) => {
    setAlerts(alerts.filter((alert) => alert.id !== id))
  }

  const toggleSetting = (id: string) => {
    setAlertSettings(
      alertSettings.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
    )
  }

  const updateThreshold = (id: string, threshold: number) => {
    setAlertSettings(alertSettings.map((setting) => (setting.id === id ? { ...setting, threshold } : setting)))
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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
      <main className="p-6 space-y-6">
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
              {alerts.map((alert) => (
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
                        <Button size="sm" variant="outline" onClick={() => markAsRead(alert.id)}>
                          Mark Read
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                          onChange={(e) => updateThreshold(setting.id, Number(e.target.value))}
                          className="w-24 h-8 text-xs"
                        />
                        <span className="text-xs text-gray-500">{setting.id.includes("budget") ? "%" : "₹"}</span>
                      </div>
                    )}
                  </div>
                  <Switch checked={setting.enabled} onCheckedChange={() => toggleSetting(setting.id)} />
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
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent">
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
