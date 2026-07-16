"use client"

import { createContext, useContext } from 'react'
import { NotificationEngine } from './engine'
import { EventBus } from './event-bus'
import type { Notification, CreateNotificationInput, NotificationFilters } from './types'
import type { NotificationEngineOptions } from './engine'

export interface NotificationContextValue {
  engine: NotificationEngine
  notifications: Notification[]
  unreadCount: number
  publish: (input: CreateNotificationInput) => Notification
  markRead: (id: string) => void
  markAllRead: () => void
  delete: (id: string) => void
  clearAll: () => void
  getNotifications: (filters?: NotificationFilters) => Notification[]
  eventBus: EventBus
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

function createFallbackContext(): NotificationContextValue {
  const eventBus = new EventBus()
  const engine = new NotificationEngine({ autoPersist: false })
  
  return {
    engine,
    notifications: [],
    unreadCount: 0,
    publish: () => ({ id: '', type: 'info', priority: 'low', title: '', message: '', timestamp: 0, read: false }),
    markRead: () => {},
    markAllRead: () => {},
    delete: () => {},
    clearAll: () => {},
    getNotifications: () => [],
    eventBus,
  }
}

export function useNotificationEngine(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    return createFallbackContext()
  }
  return context
}

export function useOptionalNotificationEngine(): NotificationContextValue | null {
  return useContext(NotificationContext)
}
