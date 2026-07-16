"use client"

import type { Notification } from '@/lib/notifications'
import { NOTIFICATION_TYPE_CONFIG, NOTIFICATION_PRIORITY_CONFIG, NOTIFICATION_CATEGORY_CONFIG } from '@/lib/notifications'
import { formatNotificationTime } from '@/lib/notifications/utils'
import { Check, Trash2, ExternalLink, Pin } from 'lucide-react'
import Link from 'next/link'
import { CheckCircle2, Info, AlertTriangle, XCircle, Sparkles, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Sparkles,
  Settings,
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  onDismiss?: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ notification, onMarkRead, onDelete, onDismiss, compact = false }: NotificationItemProps) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type]
  const priorityConfig = NOTIFICATION_PRIORITY_CONFIG[notification.priority]
  const Icon = TYPE_ICONS[config.icon] ?? Settings
  const isPinned = notification.priority === 'critical' || notification.priority === 'high' || notification.dismissed
  const categoryLabel = notification.category ? NOTIFICATION_CATEGORY_CONFIG[notification.category]?.label : undefined

  if (compact) {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
          notification.read ? 'opacity-60' : isPinned ? 'bg-muted/60' : 'bg-muted/30'
        }`}
      >
        <div className={`mt-0.5 ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${notification.read ? 'text-muted-foreground' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-muted-foreground">
              {formatNotificationTime(notification.timestamp)}
            </p>
            {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500" />}
          </div>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        notification.read ? 'border-border/60 opacity-70' : isPinned ? 'border-l-4 border-amber-400' : 'border-l-4 bg-card'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className={`font-semibold truncate ${notification.read ? 'text-muted-foreground' : ''}`}>
            {notification.title}
          </h3>
          {!notification.read && (
            <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
              New
            </span>
          )}
          {isPinned && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Pin className="h-2.5 w-2.5" />
              Pinned
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              {categoryLabel}
            </span>
          )}
        </div>
        <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatNotificationTime(notification.timestamp)}
        </p>
        {notification.action_url && (
          <Link
            href={notification.action_url}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            View details
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && onMarkRead && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkRead(notification.id)}
            className="h-8 w-8 p-0"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDismiss && isPinned && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(notification.id)}
            className="h-8 w-8 p-0"
            title="Dismiss"
          >
            <Pin className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(notification.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
