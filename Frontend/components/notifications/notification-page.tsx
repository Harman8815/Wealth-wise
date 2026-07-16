"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useNotifications, useUnreadCount, useMarkNotificationRead, useDeleteNotification, useMarkAllNotificationsRead, useClearAllNotifications, useDismissNotification, useNotificationEngine } from '@/lib/notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Bell,
  Inbox,
  CheckCheck,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Pin,
} from 'lucide-react'
import { NotificationItem } from './notification-item'
import { NotificationFiltersBar } from './notification-filters'
import { groupNotificationsByDate, orderNotifications, isPersistent } from '@/lib/notifications/utils'
import type { Notification, NotificationFilters } from '@/lib/notifications'

const GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  older: 'Older',
}

export function NotificationsPage() {
  const [filters, setFilters] = useState<NotificationFilters>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const notifications = useNotifications(filters)
  const unreadCount = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const deleteNotification = useDeleteNotification()
  const markAllRead = useMarkAllNotificationsRead()
  const clearAll = useClearAllNotifications()
  const dismiss = useDismissNotification()
  const { publish } = useNotificationEngine()

  const filteredAndGrouped = useMemo(() => {
    const sorted = orderNotifications(notifications)
    return groupNotificationsByDate(sorted)
  }, [notifications])

  const totalFiltered = notifications.length

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === totalFiltered) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map((n: Notification) => n.id)))
    }
  }

  const handleBulkMarkRead = () => {
    selectedIds.forEach((id) => markRead(id))
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteNotification(id))
    setSelectedIds(new Set())
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    publish({
      type: 'system',
      category: 'System',
      title: 'Notifications refreshed',
      message: 'Your notification list has been updated.',
      priority: 'low',
    })
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
      clearAll()
      setSelectedIds(new Set())
    }
  }

  const handleFiltersChange = (newFilters: NotificationFilters) => {
    setFilters(newFilters)
    setSelectedIds(new Set())
  }

  const handleClearFilters = () => {
    setFilters({})
    setSelectedIds(new Set())
  }

  const allSelected = selectedIds.size === totalFiltered && totalFiltered > 0
  const someSelected = selectedIds.size > 0 && !allSelected
  const pinnedCount = notifications.filter((n: Notification) => isPersistent(n)).length

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/alerts">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all your notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {pinnedCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => notifications.filter((n: Notification) => isPersistent(n)).forEach((n: Notification) => dismiss(n.id))}>
                <Pin className="w-4 h-4 mr-2" />
                Dismiss Pinned
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={totalFiltered === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Search and filter your notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </CardContent>
        </Card>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark as Read
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {totalFiltered === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No notifications found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mt-1">
                  {Object.keys(filters).length > 0
                    ? 'Try adjusting your filters to find what you\'re looking for.'
                    : 'You\'re all caught up! New notifications will appear here.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>
                    {totalFiltered} notification{totalFiltered !== 1 ? 's' : ''} total
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(filteredAndGrouped).map(([groupKey, groupNotifications]) => {
                if (groupNotifications.length === 0) return null
                return (
                  <div key={groupKey} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {GROUP_LABELS[groupKey] ?? groupKey}
                      </h3>
                      <div className="h-px flex-1 bg-border/60" />
                      <Badge variant="outline" className="text-[10px]">
                        {groupNotifications.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {groupNotifications.map((notification: Notification) => (
                        <div key={notification.id} className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(notification.id)}
                            onCheckedChange={() => handleSelectToggle(notification.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <NotificationItem
                              notification={notification}
                              onMarkRead={markRead}
                              onDelete={deleteNotification}
                              onDismiss={dismiss}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <Bell className="w-4 h-4 mr-2 text-blue-500" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalFiltered}</div>
              <p className="text-xs text-gray-500">All notifications</p>
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
              <p className="text-xs text-gray-500">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <CheckCheck className="w-4 h-4 mr-2 text-green-500" />
                Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {totalFiltered - unreadCount}
              </div>
              <p className="text-xs text-gray-500">Acknowledged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <Pin className="w-4 h-4 mr-2 text-amber-500" />
                Pinned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pinnedCount}</div>
              <p className="text-xs text-gray-500">Need acknowledgement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center text-gray-600 dark:text-gray-400">
                <Trash2 className="w-4 h-4 mr-2 text-purple-500" />
                Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {selectedIds.size}
              </div>
              <p className="text-xs text-gray-500">For bulk action</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
