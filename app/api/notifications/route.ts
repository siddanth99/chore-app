import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { listNotificationsForUser } from '@/server/api/notifications'

/**
 * GET /api/notifications
 * Returns notifications for the current user
 * Query params:
 * - onlyUnread: true|false (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const onlyUnread = searchParams.get('onlyUnread') === 'true'

    const notifications = await listNotificationsForUser(user.id, {
      onlyUnread,
    })

    // Serialize dates to ISO strings
    const serialized = notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }))

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

