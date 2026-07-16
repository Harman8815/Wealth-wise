"use client"

import { NotificationDropdown } from './notification-dropdown'

export function NotificationWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <NotificationDropdown />
    </div>
  )
}
