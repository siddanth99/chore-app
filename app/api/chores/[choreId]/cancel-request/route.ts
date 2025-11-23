import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'
import { requestCancellation } from '@/server/api/cancellations'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const worker = await requireRole(UserRole.WORKER)
    const { choreId } = await context.params
    const body = await request.json()
    const { reason } = body

    const result = await requestCancellation(choreId, worker.id, reason)

    return NextResponse.json({
      chore: result.chore,
      cancellationRequest: result.request,
    })
  } catch (error: any) {
    console.error('Error requesting cancellation:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    if (error.message.includes('Only the assigned worker') || error.message.includes('must be ASSIGNED')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to request cancellation' },
      { status: 400 }
    )
  }
}

