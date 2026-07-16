import type { NotificationType, NotificationPriority } from './types'

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; color: string; bgColor: string; icon: string }> = {
  success: {
    label: 'Success',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    icon: 'CheckCircle2',
  },
  info: {
    label: 'Info',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    icon: 'Info',
  },
  warning: {
    label: 'Warning',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    icon: 'AlertTriangle',
  },
  error: {
    label: 'Error',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    icon: 'XCircle',
  },
  ai_insight: {
    label: 'AI Insight',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    icon: 'Sparkles',
  },
  system: {
    label: 'System',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    icon: 'Settings',
  },
}

export const NOTIFICATION_PRIORITY_CONFIG: Record<NotificationPriority, { label: string; order: number }> = {
  high: { label: 'High', order: 0 },
  medium: { label: 'Medium', order: 1 },
  low: { label: 'Low', order: 2 },
}

export const DEFAULT_PRIORITY: NotificationPriority = 'medium'

export const MAX_IN_MEMORY_NOTIFICATIONS = 100
