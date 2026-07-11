"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { type LucideIcon, Wallet, LayoutGrid, FileBarChart, Mail, Monitor, ArrowLeft, RotateCcw, Bell, Check, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAlertSettings, useToggleAlertSetting, useResetAlertSettings } from "@/hooks"
import type { AlertSetting } from "@/api/services"

type AlertCategory = AlertSetting["category"]

interface NotificationCategoryDef {
  key: string
  label: string
  description: string
  icon: LucideIcon
  /** Backend setting_id this category is wired to (when it exists). */
  settingId?: string
  /** Backend category the setting belongs to (used for mapping). */
  category?: AlertCategory
  /** Future-ready categories have no backend setting yet. */
  future?: boolean
}

/**
 * Data-driven list of notification categories surfaced in the UI.
 * Add a new category here and (optionally) map it to a backend setting_id.
 */
const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  {
    key: "budget",
    label: "Budget alerts",
    description: "Get notified when you exceed or approach your overall and category budgets.",
    icon: Wallet,
    settingId: "budget_warning",
    category: "Budget",
  },
  {
    key: "category",
    label: "Category alerts",
    description: "Reminders for upcoming bills and per-category spending limits.",
    icon: LayoutGrid,
    settingId: "bill_reminders",
    category: "Bills",
  },
  {
    key: "report",
    label: "Report notifications",
    description: "Weekly and monthly spending summaries delivered to you.",
    icon: FileBarChart,
    future: true,
  },
  {
    key: "email",
    label: "Email notifications",
    description: "Receive alerts and digests directly in your inbox.",
    icon: Mail,
    future: true,
  },
  {
    key: "browser",
    label: "Browser notifications",
    description: "Real-time push alerts straight to your browser.",
    icon: Monitor,
    future: true,
  },
]

export function NotificationSettingsPage() {
  const { data: settingsData, isLoading, isError, error } = useAlertSettings()
  const toggleSetting = useToggleAlertSetting()
  const resetSettings = useResetAlertSettings()
  const [justSaved, setJustSaved] = useState<string | null>(null)

  const settings = useMemo<AlertSetting[]>(
    () => settingsData?.results ?? [],
    [settingsData],
  )

  const settingByKey = useMemo(() => {
    const map = new Map<string, AlertSetting>()
    for (const def of NOTIFICATION_CATEGORIES) {
      if (def.settingId) {
        const match = settings.find((s) => s.setting_id === def.settingId)
        if (match) map.set(def.key, match)
      }
    }
    return map
  }, [settings])

  const enabledCount = settings.filter((s) => s.enabled).length

  const handleToggle = (def: NotificationCategoryDef) => {
    const setting = settingByKey.get(def.key)
    if (!setting) return
    toggleSetting.mutate(setting.id, {
      onSuccess: () => {
        setJustSaved(def.key)
        window.setTimeout(() => setJustSaved(null), 1500)
      },
    })
  }

  const handleReset = () => {
    resetSettings.mutate()
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Notification Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Choose how and when WealthWise notifies you
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/alerts">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Alerts
            </Link>
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
              Notification Categories
            </CardTitle>
            <CardDescription>
              {settings.length > 0
                ? `${enabledCount} of ${settings.length} alert rules enabled`
                : "Loading your preferences…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>
                  {(error as Error)?.message ?? "Failed to load notification settings."}
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="space-y-4">
                {NOTIFICATION_CATEGORIES.map((def) => (
                  <div
                    key={def.key}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {NOTIFICATION_CATEGORIES.map((def) => {
                  const Icon = def.icon
                  const setting = settingByKey.get(def.key)
                  const checked = setting ? setting.enabled : false
                  const isToggling = toggleSetting.isPending
                  return (
                    <div
                      key={def.key}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{def.label}</h3>
                            {def.future && (
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                Coming soon
                              </Badge>
                            )}
                            {justSaved === def.key && (
                              <Badge className="bg-green-500 text-white text-[10px]">
                                <Check className="w-3 h-3 mr-1" />
                                Saved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {def.description}
                          </p>
                          {setting && (
                            <p className="text-xs text-gray-500 mt-1">
                              Connected to <span className="font-medium">{setting.title}</span>
                              {setting.threshold != null && ` · threshold ${setting.threshold}${setting.threshold_unit ?? ""}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        disabled={def.future || !setting || isToggling}
                        onCheckedChange={() => handleToggle(def)}
                        aria-label={`Toggle ${def.label}`}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Restore the default notification configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetSettings.isPending || isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to defaults
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
