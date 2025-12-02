'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/button'

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
  return date.toLocaleDateString()
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
      router.push(notification.link)
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Notifications
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        {!hasAnyNotifications ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {filteredToday.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Today
                </h2>
                <div className="space-y-2">
                  {filteredToday.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={`transition-shadow hover:shadow-md ${
                          !notification.isRead
                            ? 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-base ${
                                !notification.isRead
                                  ? 'font-semibold text-slate-900 dark:text-slate-50'
                                  : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <Badge variant="statusPublished" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {filteredThisWeek.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  This Week
                </h2>
                <div className="space-y-2">
                  {filteredThisWeek.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={`transition-shadow hover:shadow-md ${
                          !notification.isRead
                            ? 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-base ${
                                !notification.isRead
                                  ? 'font-semibold text-slate-900 dark:text-slate-50'
                                  : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <Badge variant="statusPublished" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earlier */}
            {filteredEarlier.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Earlier
                </h2>
                <div className="space-y-2">
                  {filteredEarlier.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={`transition-shadow hover:shadow-md ${
                          !notification.isRead
                            ? 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-base ${
                                !notification.isRead
                                  ? 'font-semibold text-slate-900 dark:text-slate-50'
                                  : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <Badge variant="statusPublished" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


