import type { Notification, NotificationGroup } from '@/lib/notifications'

export function getNotificationGroup(timestamp: number): NotificationGroup {
  const date = new Date(timestamp)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

  if (date >= startOfToday) {
    return 'today'
  }

  if (date >= startOfYesterday) {
    return 'yesterday'
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
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    if (priorityDiff !== 0) return priorityDiff
    return b.timestamp - a.timestamp
  })
}
