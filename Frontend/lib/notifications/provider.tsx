"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { NotificationEngine } from './engine'
import type { NotificationEngineOptions } from './engine'
import { NotificationContext } from './context'
import type { Notification, CreateNotificationInput, NotificationFilters } from './types'

interface NotificationProviderProps {
  children: React.ReactNode
  options?: NotificationEngineOptions
}

export function NotificationProvider({ children, options }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const engine = useMemo(() => new NotificationEngine(options), [options])

  useEffect(() => {
    let mounted = true

    engine.initialize().then(() => {
      if (mounted) {
        setNotifications(engine.getNotifications())
        setIsInitialized(true)
      }
    })

    const unsubscribe = engine.subscribe((updated) => {
      if (mounted) {
        setNotifications(updated)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [engine])

  const publish = useCallback((input: CreateNotificationInput) => {
    return engine.publish(input)
  }, [engine])

  const markRead = useCallback((id: string) => {
    engine.markRead(id)
  }, [engine])

  const markAllRead = useCallback(() => {
    engine.markAllRead()
  }, [engine])

  const deleteNotification = useCallback((id: string) => {
    engine.delete(id)
  }, [engine])

  const dismissNotification = useCallback((id: string) => {
    engine.dismiss(id)
  }, [engine])

  const clearAll = useCallback(() => {
    engine.clearAll()
  }, [engine])

  const getNotifications = useCallback((filters?: NotificationFilters) => {
    return engine.getNotifications(filters)
  }, [engine])

  const unreadCount = useMemo(() => engine.getUnreadCount(), [notifications])

  const contextValue = useMemo(() => ({
    engine,
    notifications,
    unreadCount,
    publish,
    markRead,
    markAllRead,
    dismiss: dismissNotification,
    delete: deleteNotification,
    clearAll,
    getNotifications,
    eventBus: engine.getEventBus(),
  }), [engine, notifications, unreadCount, publish, markRead, markAllRead, dismissNotification, deleteNotification, clearAll, getNotifications])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}
