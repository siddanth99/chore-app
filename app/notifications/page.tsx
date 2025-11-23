import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import { listNotificationsForUser } from '@/server/api/notifications'
import NotificationsClient from './notifications-client'

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const allNotifications = await listNotificationsForUser(user.id)
  const unreadNotifications = await listNotificationsForUser(user.id, {
    onlyUnread: true,
  })

  // Group notifications by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisWeek = new Date(today)
  thisWeek.setDate(thisWeek.getDate() - 7)

  const todayNotifications = allNotifications.filter(
    (n: any) => new Date(n.createdAt) >= today
  )
  const thisWeekNotifications = allNotifications.filter(
    (n: any) => {
      const date = new Date(n.createdAt)
      return date >= thisWeek && date < today
    }
  )
  const earlierNotifications = allNotifications.filter(
    (n: any) => new Date(n.createdAt) < thisWeek
  )

  return (
    <NotificationsClient
      todayNotifications={todayNotifications.map((n: any) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      thisWeekNotifications={thisWeekNotifications.map((n: any) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      earlierNotifications={earlierNotifications.map((n: any) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
      unreadCount={unreadNotifications.length}
    />
  )
}

