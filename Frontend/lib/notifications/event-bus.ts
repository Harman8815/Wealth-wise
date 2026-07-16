import type { NotificationEvent } from './types'

type EventHandler = (event: NotificationEvent) => void

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      const handlers = this.handlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.handlers.delete(event)
        }
      }
    }
  }

  emit(event: string, payload: Record<string, unknown>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const notificationEvent: NotificationEvent = { type: event, payload }
      handlers.forEach((handler) => {
        try {
          handler(notificationEvent)
        } catch {
          // Ignore handler errors
        }
      })
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}
