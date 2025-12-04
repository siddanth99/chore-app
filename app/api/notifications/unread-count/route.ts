import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { getUnreadCount } from '@/server/api/notifications'

/**
 * GET /api/notifications/unread-count
 * Returns the unread notification count for the current user
 * Lightweight endpoint for navbar polling
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unread = await getUnreadCount(user.id)

    return NextResponse.json({ unread })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}

