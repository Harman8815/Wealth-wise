"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react"
import { useNotificationEngine } from "@/lib/notifications"
import type { Notification, NotificationType } from "@/lib/notifications"

export type PopupVariant = "success" | "info" | "warning" | "error"

interface PopupItem {
  id: string
  variant: PopupVariant
  title: string
  message?: string
}

interface NotificationPopupContextValue {
  push: (input: { variant: PopupVariant; title: string; message?: string }) => void
}

const NotificationPopupContext = createContext<NotificationPopupContextValue | null>(null)

const VARIANT_CONFIG: Record<PopupVariant, { icon: React.ReactNode; ring: string; accent: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    ring: "border-l-emerald-500",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    ring: "border-l-blue-500",
    accent: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    ring: "border-l-amber-500",
    accent: "text-amber-600 dark:text-amber-400",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    ring: "border-l-red-500",
    accent: "text-red-600 dark:text-red-400",
  },
}

const MAX_VISIBLE = 4
const AUTO_DISMISS_MS = 5000

function mapTypeToVariant(type: NotificationType): PopupVariant {
  switch (type) {
    case "success":
      return "success"
    case "warning":
      return "warning"
    case "error":
      return "error"
    default:
      return "info"
  }
}

export function NotificationPopupProvider({ children }: { children: React.ReactNode }) {
  const { engine } = useNotificationEngine()
  const [items, setItems] = useState<PopupItem[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const push = useCallback((input: { variant: PopupVariant; title: string; message?: string }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setItems((prev) => {
      const next = [...prev, { id, ...input }]
      return next.slice(-MAX_VISIBLE)
    })
    window.setTimeout(() => remove(id), AUTO_DISMISS_MS)
  }, [remove])

  // Bridge: any notification published to the engine surfaces as a pop-up and
  // is already persisted in the Notification Center via the sync layer.
  useEffect(() => {
    const unsubscribe = engine.subscribe((notifications) => {
      const latest = notifications[0]
      if (!latest) return
      if (seenRef.current.has(latest.id)) return
      seenRef.current.add(latest.id)
      if (seenRef.current.size > 200) seenRef.current.clear()
      push({
        variant: mapTypeToVariant(latest.type),
        title: latest.title,
        message: latest.message,
      })
    })
    return unsubscribe
  }, [engine, push])

  return (
    <NotificationPopupContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {items.map((item) => {
          const config = VARIANT_CONFIG[item.variant]
          return (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-lg border border-l-4 ${config.ring} border-border bg-background shadow-lg px-4 py-3 flex items-start gap-3 popup-enter`}
              role="status"
            >
              <div className="mt-0.5 shrink-0">{config.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.message && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">{item.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </NotificationPopupContext.Provider>
  )
}

export function useNotificationPopup(): NotificationPopupContextValue {
  const ctx = useContext(NotificationPopupContext)
  if (!ctx) {
    return { push: () => {} }
  }
  return ctx
}
