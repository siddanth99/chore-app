import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { markAllNotificationsRead } from '@/server/api/notifications'

/**
 * POST /api/notifications/mark-all-read
 * Marks all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await markAllNotificationsRead(user.id)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}

