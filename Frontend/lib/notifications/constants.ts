import type { NotificationType, NotificationPriority, NotificationCategory } from './types'

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

export const NOTIFICATION_PRIORITY_CONFIG: Record<NotificationPriority, { label: string; order: number; color: string; bgColor: string }> = {
  critical: { label: 'Critical', order: 0, color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/40' },
  high: { label: 'High', order: 1, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  medium: { label: 'Medium', order: 2, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  low: { label: 'Low', order: 3, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-950' },
}

export const NOTIFICATION_CATEGORY_CONFIG: Record<NotificationCategory, { label: string }> = {
  Budget: { label: 'Budget' },
  Bills: { label: 'Bills' },
  Goals: { label: 'Goals' },
  Security: { label: 'Security' },
  Account: { label: 'Account' },
  Investments: { label: 'Investments' },
  Activity: { label: 'Activity' },
  System: { label: 'System' },
  AI: { label: 'AI' },
}

export const NOTIFICATION_CATEGORY_ORDER: NotificationCategory[] = [
  'Budget',
  'Bills',
  'Goals',
  'Security',
  'Account',
  'Investments',
  'AI',
  'Activity',
  'System',
]

export const DEFAULT_PRIORITY: NotificationPriority = 'medium'

export const MAX_IN_MEMORY_NOTIFICATIONS = 100
