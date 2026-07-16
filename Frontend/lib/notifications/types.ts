export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'ai_insight' | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: number
  read: boolean
  category?: string
  action_url?: string
  data?: Record<string, unknown>
}

export interface CreateNotificationInput {
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  category?: string
  action_url?: string
  data?: Record<string, unknown>
}

export interface NotificationFilters {
  type?: NotificationType
  priority?: NotificationPriority
  read?: boolean
  category?: string
  search?: string
  dateFrom?: number
  dateTo?: number
}

export interface NotificationEvent {
  type: string
  payload: Record<string, unknown>
}

export type NotificationGroup = 'today' | 'yesterday' | 'older'
