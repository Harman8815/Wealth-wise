"use client"

import type { Alert, AlertCategory, AlertPriority, AlertType } from '@/api/services/alerts'
import type { Notification, NotificationCategory, NotificationPriority, NotificationType } from './types'

/** Map a backend Alert category to the client notification category. */
function mapCategory(category: AlertCategory): NotificationCategory {
  return category as NotificationCategory
}

/** Map a backend Alert priority to the client notification priority. */
function mapPriority(priority: AlertPriority): NotificationPriority {
  if (priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }
  return 'medium'
}

/** Map a backend Alert type to the client notification type. */
function mapType(type: AlertType, category: AlertCategory): NotificationType {
  if (category === 'AI') return 'ai_insight'
  if (category === 'System') return 'system'
  return type as NotificationType
}

/** Convert a backend Alert into the local Notification shape used by the UI. */
export function alertToNotification(alert: Alert): Notification {
  return {
    id: alert.id,
    remoteId: alert.id,
    type: mapType(alert.type, alert.category),
    priority: mapPriority(alert.priority),
    title: alert.title,
    message: alert.message,
    timestamp: new Date(alert.timestamp).getTime(),
    read: alert.read,
    dismissed: alert.dismissed,
    category: mapCategory(alert.category),
    action_url: alert.action_url || undefined,
  }
}

/** Convert a locally-published notification into a backend Alert payload. */
export function notificationToAlertInput(notification: Notification) {
  const category: AlertCategory = (notification.category as AlertCategory) ?? 'Activity'
  const type: AlertType =
    notification.type === 'ai_insight' || notification.type === 'system'
      ? 'info'
      : (notification.type as AlertType)

  return {
    type,
    title: notification.title,
    message: notification.message,
    category,
    priority: notification.priority as AlertPriority,
    action_url: notification.action_url,
  }
}
