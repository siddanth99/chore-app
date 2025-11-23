import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { markNotificationRead } from '@/server/api/notifications'

/**
 * POST /api/notifications/mark-read
 * Marks a notification as read
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    await markNotificationRead(id, user.id)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 400 }
    )
  }
}

