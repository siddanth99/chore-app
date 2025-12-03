import { NextRequest, NextResponse } from 'next/server'
import { listMessages, sendMessage } from '@/server/api/chat'
import { requireAuth, isAuthError, getHttpStatusForAuthError } from '@/server/auth/role'
import { messageSendLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await requireAuth()
    const { choreId } = await context.params

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await requireAuth()

    // Rate limiting: Prevent chat spam
    const rateLimitKey = getRateLimitKey(request, user.id)
    const { success, reset } = await messageSendLimiter.limit(rateLimitKey)
    
    if (!success) {
      return NextResponse.json(
        createRateLimitResponse(reset, 'Rate limit exceeded. Please slow down your messages.'),
        { status: 429 }
      )
    }

    const { choreId } = await context.params
    const body = await request.json()

    const content = body.content
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
    
    // Handle auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Access denied' },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 400 }
    )
  }
}
