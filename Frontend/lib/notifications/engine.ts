function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`
}

import { EventBus } from './event-bus'
import { NotificationStorage } from './storage'
import type { Notification, CreateNotificationInput, NotificationFilters } from './types'
import { DEFAULT_PRIORITY, MAX_IN_MEMORY_NOTIFICATIONS } from './constants'

export interface NotificationEngineOptions {
  maxInMemory?: number
  autoPersist?: boolean
}

export class NotificationEngine {
  private eventBus: EventBus
  private storage: NotificationStorage
  private memoryCache: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private options: NotificationEngineOptions

  constructor(options: NotificationEngineOptions = {}) {
    this.options = {
      maxInMemory: options.maxInMemory ?? MAX_IN_MEMORY_NOTIFICATIONS,
      autoPersist: options.autoPersist ?? true,
    }
    this.eventBus = new EventBus()
    this.storage = new NotificationStorage()
  }

  async initialize(): Promise<void> {
    await this.storage.init()
    const stored = await this.storage.getAll()
    this.memoryCache = stored.slice(0, this.options.maxInMemory)
  }

  /**
   * Merge a notification that originated from the backend into the local cache.
   * Used by the API sync bridge so server-side alerts appear in the UI. New
   * remote ids replace local placeholders; existing ids are updated in place.
   */
  ingestFromRemote(notification: Notification): void {
    const index = this.memoryCache.findIndex((n) => n.id === notification.id)
    if (index !== -1) {
      this.memoryCache[index] = { ...this.memoryCache[index], ...notification }
    } else {
      this.memoryCache.unshift(notification)
      if (this.memoryCache.length > (this.options.maxInMemory ?? MAX_IN_MEMORY_NOTIFICATIONS)) {
        this.memoryCache = this.memoryCache.slice(0, this.options.maxInMemory ?? MAX_IN_MEMORY_NOTIFICATIONS)
      }
    }
    this.notifyListeners()
  }

  getEventBus(): EventBus {
    return this.eventBus
  }

  publish(input: CreateNotificationInput): Notification {
    const notification: Notification = {
      id: generateId(),
      type: input.type,
      priority: input.priority ?? DEFAULT_PRIORITY,
      title: input.title,
      message: input.message,
      timestamp: Date.now(),
      read: false,
      category: input.category,
      action_url: input.action_url,
      data: input.data,
    }

    this.memoryCache.unshift(notification)

    if (this.memoryCache.length > (this.options.maxInMemory ?? MAX_IN_MEMORY_NOTIFICATIONS)) {
      this.memoryCache = this.memoryCache.slice(0, this.options.maxInMemory ?? MAX_IN_MEMORY_NOTIFICATIONS)
    }

    if ((this.options.autoPersist ?? true)) {
      this.storage.put(notification).catch((error) => {
        console.error('Failed to persist notification:', error)
      })
    }

    this.eventBus.emit('notification:created', { notification })

    this.notifyListeners()

    return notification
  }

  markRead(id: string): void {
    const notification = this.memoryCache.find((n) => n.id === id)
    if (notification && !notification.read) {
      notification.read = true
      this.eventBus.emit('notification:read', { id, notification })

      if (this.options.autoPersist) {
        this.storage.put(notification).catch((error) => {
          console.error('Failed to persist read state:', error)
        })
      }

      this.notifyListeners()
    }
  }

  markAllRead(): void {
    let changed = false
    for (const notification of this.memoryCache) {
      if (!notification.read) {
        notification.read = true
        changed = true
      }
    }

    if (changed) {
      this.eventBus.emit('notification:all_read', {})

      if (this.options.autoPersist) {
        this.storage.putMany(this.memoryCache).catch((error) => {
          console.error('Failed to persist read states:', error)
        })
      }

      this.notifyListeners()
    }
  }

  delete(id: string): void {
    const index = this.memoryCache.findIndex((n) => n.id === id)
    if (index !== -1) {
      this.memoryCache.splice(index, 1)
      this.eventBus.emit('notification:deleted', { id })

      if (this.options.autoPersist) {
        this.storage.delete(id).catch((error) => {
          console.error('Failed to delete notification:', error)
        })
      }

      this.notifyListeners()
    }
  }

  dismiss(id: string): void {
    const notification = this.memoryCache.find((n) => n.id === id)
    if (notification && !notification.dismissed) {
      notification.dismissed = true
      this.eventBus.emit('notification:dismissed', { id, notification })

      if (this.options.autoPersist) {
        this.storage.put(notification).catch((error) => {
          console.error('Failed to persist dismissed state:', error)
        })
      }

      this.notifyListeners()
    }
  }

  clearAll(): void {
    const count = this.memoryCache.length
    this.memoryCache = []
    this.eventBus.emit('notification:cleared', { count })

    if (this.options.autoPersist) {
      this.storage.clear().catch((error) => {
        console.error('Failed to clear notifications:', error)
      })
    }

    this.notifyListeners()
  }

  getNotifications(filters?: NotificationFilters): Notification[] {
    let results = [...this.memoryCache]

    if (filters?.type) {
      results = results.filter((n) => n.type === filters.type)
    }

    if (filters?.priority) {
      results = results.filter((n) => n.priority === filters.priority)
    }

    if (filters?.read !== undefined) {
      results = results.filter((n) => n.read === filters.read)
    }

    if (filters?.category) {
      results = results.filter((n) => n.category === filters.category)
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase()
      results = results.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      )
    }

    if (filters?.dateFrom) {
      results = results.filter((n) => n.timestamp >= filters.dateFrom!)
    }

    if (filters?.dateTo) {
      results = results.filter((n) => n.timestamp <= filters.dateTo!)
    }

    return results
  }

  getUnreadCount(): number {
    return this.memoryCache.filter((n) => !n.read).length
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    const snapshot = this.getNotifications()
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot)
      } catch {
        // Ignore listener errors
      }
    })
  }
}
