"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { alertApi } from "@/api/services/alerts"
import { useNotificationEngine } from "./context"
import { NotificationStorage } from "./storage"
import { alertToNotification, notificationToAlertInput } from "./sync"
import { useActiveProject } from "@/components/project/project-context"
import type { Notification } from "./types"

/**
 * Bridges the backend Alert API and the local IndexedDB-backed notification
 * engine. It performs an initial hydrate (load cached notifications immediately
 * on startup, then refresh from the server) and keeps the two stores in sync
 * so notifications survive reloads and remain viewable offline.
 *
 * The backend scopes alerts to the active project via the X-Project-Id header,
 * so re-fetching whenever the active project changes guarantees the Notification
 * Center only shows notifications belonging to the currently selected project.
 *
 * Locally published notifications that opt in via `syncToApi` are mirrored to
 * the backend, making the Notification Center event-driven: any module can
 * publish without depending on the UI.
 */
export function NotificationSyncBridge() {
  const { engine, eventBus } = useNotificationEngine()
  const queryClient = useQueryClient()
  const { activeProjectId } = useActiveProject()
  const storageRef = useRef<NotificationStorage | null>(null)

  useEffect(() => {
    const storage = new NotificationStorage()
    storageRef.current = storage
    let cancelled = false

    async function hydrate(projectId: string | null) {
      await storage.init()
      if (cancelled) return

      try {
        // Server is the source of truth and is already scoped to the active project.
        const data = await alertApi.getAll({ pageSize: 100 })
        if (cancelled) return
        const remote = data.results ?? []
        const mapped: Notification[] = remote.map(alertToNotification)
        await engine.replaceWith(mapped)
      } catch {
        // Offline: fall back to the cached IndexedDB backlog for this project.
        if (cancelled) return
        const cached = (await storage.getAll()).filter(
          (n) => n.projectId === projectId || (projectId === null && !n.projectId),
        )
        await engine.replaceWith(cached)
      }
    }

    hydrate(activeProjectId)

    // Mirror locally published notifications to the backend.
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
  }, [engine, eventBus, queryClient, activeProjectId])

  return null
}
