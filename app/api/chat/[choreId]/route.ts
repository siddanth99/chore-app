import { NextRequest, NextResponse } from 'next/server'
import { listMessages, sendMessage } from '@/server/api/chat'
import { requireAuth } from '@/server/auth/role'

/**
 * GET /api/chat/[choreId] - List chat messages for a chore
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireAuth()
    const { choreId } = params

    const messages = await listMessages(choreId, user.id)

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error listing messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 403 }
    )
  }
}

/**
 * POST /api/chat/[choreId] - Send a new message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireAuth()
    const { choreId } = params
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    const message = await sendMessage(choreId, user.id, content)

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 400 }
    )
  }
}

