import { useSyncExternalStore } from 'react'
import { useNotificationEngine } from './context'
import type { Notification, NotificationFilters, CreateNotificationInput } from './types'

export function useNotifications(filters?: NotificationFilters): Notification[] {
  const { getNotifications } = useNotificationEngine()
  return getNotifications(filters)
}

export function useUnreadCount(): number {
  const { unreadCount } = useNotificationEngine()
  return unreadCount
}

export function useNotificationSubscribe(): Notification[] {
  const { notifications } = useNotificationEngine()
  return useSyncExternalStore(
    (onStoreChange) => {
      const { engine } = useNotificationEngine()
      return engine.subscribe(onStoreChange)
    },
    () => {
      const { notifications: current } = useNotificationEngine()
      return current
    }
  )
}

export function usePublishNotification() {
  const { publish } = useNotificationEngine()
  return publish
}

export function useMarkNotificationRead() {
  const { markRead } = useNotificationEngine()
  return markRead
}

export function useMarkAllNotificationsRead() {
  const { markAllRead } = useNotificationEngine()
  return markAllRead
}

export function useDeleteNotification() {
  const { delete: deleteNotification } = useNotificationEngine()
  return deleteNotification
}

export function useDismissNotification() {
  const { dismiss } = useNotificationEngine()
  return dismiss
}

export function useClearAllNotifications() {
  const { clearAll } = useNotificationEngine()
  return clearAll
}

export function useEventBus() {
  const { eventBus } = useNotificationEngine()
  return eventBus
}

export function useNotificationEvent<T = Record<string, unknown>>(eventName: string, handler: (payload: T) => void): () => void {
  const { eventBus } = useNotificationEngine()
  
  if (typeof window !== 'undefined') {
    const wrappedHandler = (event: { type: string; payload: T }) => {
      if (event.type === eventName) {
        handler(event.payload)
      }
    }
    return eventBus.subscribe(eventName, wrappedHandler as (event: { type: string; payload: unknown }) => void)
  }
  
  return () => {}
}
