export type NotificationType =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'ai_insight'
  | 'system'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export type NotificationCategory =
  | 'Budget'
  | 'Bills'
  | 'Goals'
  | 'Security'
  | 'Account'
  | 'Investments'
  | 'Activity'
  | 'System'
  | 'AI'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: number
  read: boolean
  category?: NotificationCategory
  dismissed?: boolean
  action_url?: string
  data?: Record<string, unknown>
  /** Set when the notification originated from / is mirrored to the backend API. */
  remoteId?: string
}

export interface CreateNotificationInput {
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  category?: NotificationCategory
  action_url?: string
  data?: Record<string, unknown>
  /** When true the notification is also persisted to the backend. */
  syncToApi?: boolean
}

export interface NotificationFilters {
  type?: NotificationType
  priority?: NotificationPriority
  read?: boolean
  category?: NotificationCategory
  search?: string
  dateFrom?: number
  dateTo?: number
}

export interface NotificationEvent {
  type: string
  payload: Record<string, unknown>
}

export type NotificationGroup = 'today' | 'yesterday' | 'this_week' | 'older'
