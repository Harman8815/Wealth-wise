"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotificationEngine, useNotifications, useUnreadCount, useDeleteNotification, useMarkNotificationRead, useClearAllNotifications } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Inbox, CheckCheck, Trash2, X } from 'lucide-react'
import { NotificationItem } from './notification-item'
import { groupNotificationsByDate, orderNotifications } from '@/lib/notifications/utils'
import type { Notification } from '@/lib/notifications'

const GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  older: 'Older',
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { publish } = useNotificationEngine()
  const notifications = useNotifications()
  const unreadCount = useUnreadCount()
  const deleteNotification = useDeleteNotification()
  const markRead = useMarkNotificationRead()
  const clearAll = useClearAllNotifications()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const ordered = orderNotifications(notifications)
  const displayNotifications = ordered.slice(0, 20)
  const hasMore = notifications.length > 20

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const grouped = groupNotificationsByDate(displayNotifications)
  const hasNotifications = displayNotifications.length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-300 hover:text-white hover:bg-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] h-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[500px] rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRead(notifications.find((n: Notification) => !n.read)?.id ?? '')}
                    className="h-7 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {!hasNotifications ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {Object.entries(grouped).map(([groupKey, groupNotifications]) => {
                    if (groupNotifications.length === 0) return null
                    return (
                      <div key={groupKey} className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2">
                          {GROUP_LABELS[groupKey] ?? groupKey}
                        </h4>
                        <div className="space-y-1">
                          {groupNotifications.map((notification: Notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              compact
                              onMarkRead={markRead}
                              onDelete={deleteNotification}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {hasMore && (
                    <div className="text-center py-2">
                      <Link href="/dashboard/notifications">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setIsOpen(false)}
                        >
                          View all notifications
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}
