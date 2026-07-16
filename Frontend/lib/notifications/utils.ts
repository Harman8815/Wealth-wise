import type { Notification, NotificationGroup, NotificationPriority } from '@/lib/notifications'
import { NOTIFICATION_PRIORITY_CONFIG } from './constants'

const DAY_MS = 24 * 60 * 60 * 1000

export function getNotificationGroup(timestamp: number): NotificationGroup {
  const date = new Date(timestamp)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - DAY_MS)
  const startOfThisWeek = new Date(startOfToday.getTime() - 6 * DAY_MS)

  if (date >= startOfToday) {
    return 'today'
  }

  if (date >= startOfYesterday) {
    return 'yesterday'
  }

  if (date >= startOfThisWeek) {
    return 'this_week'
  }

  return 'older'
}

export function formatNotificationTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function formatNotificationDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function groupNotificationsByDate(notifications: Notification[]): Record<NotificationGroup, Notification[]> {
  const groups: Record<NotificationGroup, Notification[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    older: [],
  }

  for (const notification of notifications) {
    const group = getNotificationGroup(notification.timestamp)
    groups[group].push(notification)
  }

  return groups
}

export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    const priorityDiff =
      (NOTIFICATION_PRIORITY_CONFIG[a.priority]?.order ?? 9) -
      (NOTIFICATION_PRIORITY_CONFIG[b.priority]?.order ?? 9)
    if (priorityDiff !== 0) return priorityDiff
    return b.timestamp - a.timestamp
  })
}

/** Persistent notifications (critical/high or explicitly dismissed) stay visible. */
export function isPersistent(notification: Notification): boolean {
  return (
    notification.priority === 'critical' ||
    notification.priority === 'high' ||
    notification.dismissed === true
  )
}

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Pin critical/high notifications to the top, then sort by recency. */
export function orderNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    const pinnedDiff = Number(isPersistent(b)) - Number(isPersistent(a))
    if (pinnedDiff !== 0) return pinnedDiff
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.timestamp - a.timestamp
  })
}

