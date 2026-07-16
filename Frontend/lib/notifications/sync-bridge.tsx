"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { alertApi } from "@/api/services/alerts"
import { useNotificationEngine } from "./context"
import { NotificationStorage } from "./storage"
import { alertToNotification, notificationToAlertInput } from "./sync"
import type { Notification } from "./types"

/**
 * Bridges the backend Alert API and the local IndexedDB-backed notification
 * engine. It performs an initial hydrate (load cached notifications immediately
 * on startup, then refresh from the server) and keeps the two stores in sync
 * so notifications survive reloads and remain viewable offline.
 *
 * Locally published notifications that opt in via `syncToApi` are mirrored to
 * the backend, making the Notification Center event-driven: any module can
 * publish without depending on the UI.
 */
export function NotificationSyncBridge() {
  const { engine, eventBus } = useNotificationEngine()
  const queryClient = useQueryClient()
  const storageRef = useRef<NotificationStorage | null>(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    const storage = new NotificationStorage()
    storageRef.current = storage
    let cancelled = false

    async function hydrate() {
      // 1. Load cached notifications from IndexedDB immediately.
      await storage.init()
      if (cancelled) return
      const cached = await storage.getAll()
      if (cancelled) return
      for (const n of cached) {
        engine.ingestFromRemote?.(n)
      }

      // 2. Refresh from the backend (catch up on new server-side alerts).
      try {
        const data = await alertApi.getAll({ pageSize: 100 })
        if (cancelled) return
        const remote = data.results ?? []
        const mapped: Notification[] = remote.map(alertToNotification)
        await storage.putMany(mapped)
        if (cancelled) return
        for (const n of mapped) {
          engine.ingestFromRemote?.(n)
        }
      } catch {
        // Offline: keep using the cached IndexedDB backlog.
      }
      hydratedRef.current = true
    }

    hydrate()

    // 3. Mirror locally published notifications to the backend.
    const unsubscribe = eventBus.subscribe("notification:created", (event) => {
      const notification = event.payload?.notification as Notification | undefined
      if (!notification) return
      if ((notification as Notification & { syncToApi?: boolean }).syncToApi) {
        const input = notificationToAlertInput(notification)
        alertApi
          .create(input)
          .then(() => queryClient.invalidateQueries({ queryKey: ["alerts"] }))
          .catch(() => {
            /* offline: already persisted locally */
          })
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [engine, eventBus, queryClient])

  return null
}
