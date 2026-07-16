"use client"

import type { Notification } from '@/lib/notifications'
import { NOTIFICATION_TYPE_CONFIG } from '@/lib/notifications'
import { formatNotificationTime } from '@/lib/notifications/utils'
import { Button } from '@/components/ui/button'
import { Check, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ notification, onMarkRead, onDelete, compact = false }: NotificationItemProps) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type]

  const Icon = config.icon === 'CheckCircle2' ? require('lucide-react').CheckCircle2
    : config.icon === 'Info' ? require('lucide-react').Info
    : config.icon === 'AlertTriangle' ? require('lucide-react').AlertTriangle
    : config.icon === 'XCircle' ? require('lucide-react').XCircle
    : config.icon === 'Sparkles' ? require('lucide-react').Sparkles
    : require('lucide-react').Settings

  if (compact) {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
          notification.read ? 'opacity-60' : 'bg-muted/50'
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
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatNotificationTime(notification.timestamp)}
          </p>
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
        notification.read ? 'border-border/60 opacity-70' : 'border-l-4 bg-card'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold truncate ${notification.read ? 'text-muted-foreground' : ''}`}>
            {notification.title}
          </h3>
          {!notification.read && (
            <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
              New
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
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
