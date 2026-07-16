"use client"

import { NotificationProvider } from "@/lib/notifications"
import { NotificationsPage } from "@/components/notifications"

export default function NotificationsHistoryPage() {
  return (
    <NotificationProvider>
      <NotificationsPage />
    </NotificationProvider>
  )
}
