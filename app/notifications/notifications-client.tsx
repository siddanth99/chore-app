'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
  type: string
  chore?: {
    id: string
    title: string
  } | null
}

interface NotificationsClientProps {
  todayNotifications: Notification[]
  thisWeekNotifications: Notification[]
  earlierNotifications: Notification[]
  unreadCount: number
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return formatDate(date)
}

/**
 * Get icon and color based on notification type
 */
function getNotificationIcon(type: string): { icon: React.ReactNode; color: string; bgColor: string } {
  switch (type) {
    case 'APPLICATION_SUBMITTED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      }
    case 'APPLICATION_ACCEPTED':
    case 'CHORE_ASSIGNED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      }
    case 'APPLICATION_REJECTED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      }
    case 'CHORE_COMPLETED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        ),
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      }
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_SENT':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      }
    case 'RATING_RECEIVED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      }
    case 'CHORE_CANCELLED':
    case 'CANCELLATION_APPROVED':
    case 'CANCELLATION_DENIED':
    case 'CANCELLATION_REQUESTED':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ),
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      }
    case 'NEW_MESSAGE':
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        ),
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      }
    default:
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        ),
        color: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
      }
  }
}

export default function NotificationsClient({
  todayNotifications,
  thisWeekNotifications,
  earlierNotifications,
  unreadCount,
}: NotificationsClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      router.refresh()
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setMarkingAll(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notification.id }),
        })
        router.refresh()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    if (notification.link) {
      // Add ?from=notifications to chore links for back navigation
      const link = notification.link.startsWith('/chores/')
        ? `${notification.link}?from=notifications`
        : notification.link
      router.push(link)
    }
  }

  // Filter notifications based on selected filter
  const getFilteredNotifications = (notifications: Notification[]) => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.isRead)
    }
    return notifications
  }

  const filteredToday = getFilteredNotifications(todayNotifications)
  const filteredThisWeek = getFilteredNotifications(thisWeekNotifications)
  const filteredEarlier = getFilteredNotifications(earlierNotifications)

  const hasAnyNotifications =
    filteredToday.length > 0 ||
    filteredThisWeek.length > 0 ||
    filteredEarlier.length > 0

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Notifications
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'You\'re all caught up! 🎉'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="shrink-0"
              >
                {markingAll ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Marking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark all as read
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all',
              filter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
              filter === 'unread'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications list */}
        {!hasAnyNotifications ? (
          <Card className="border-dashed">
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'You\'ve read all your notifications!'
                  : 'When you receive notifications, they\'ll appear here.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Today */}
            {filteredToday.length > 0 && (
              <NotificationSection
                title="Today"
                notifications={filteredToday}
                onNotificationClick={handleNotificationClick}
              />
            )}

            {/* This Week */}
            {filteredThisWeek.length > 0 && (
              <NotificationSection
                title="This Week"
                notifications={filteredThisWeek}
                onNotificationClick={handleNotificationClick}
              />
            )}

            {/* Earlier */}
            {filteredEarlier.length > 0 && (
              <NotificationSection
                title="Earlier"
                notifications={filteredEarlier}
                onNotificationClick={handleNotificationClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Notification Section Component
function NotificationSection({
  title,
  notifications,
  onNotificationClick,
}: {
  title: string
  notifications: Notification[]
  onNotificationClick: (notification: Notification) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">
          {notifications.length}
        </span>
      </div>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClick={() => onNotificationClick(notification)}
          />
        ))}
      </div>
    </div>
  )
}

// Individual Notification Card
function NotificationCard({
  notification,
  onClick,
}: {
  notification: Notification
  onClick: () => void
}) {
  const { icon, color, bgColor } = getNotificationIcon(notification.type)
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border transition-all',
        'hover:shadow-md hover:border-primary/30',
        !notification.isRead
          ? 'bg-primary/5 border-primary/20'
          : 'bg-card border-border hover:bg-secondary/50'
      )}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', bgColor, color)}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                'text-sm',
                !notification.isRead
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-foreground/80'
              )}>
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground">
                  NEW
                </span>
              )}
            </div>
            {notification.link && (
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  )
}


