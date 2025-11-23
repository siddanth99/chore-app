import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'
import { customerDirectCancel } from '@/server/api/cancellations'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const customer = await requireRole(UserRole.CUSTOMER)
    const { choreId } = await context.params
    const body = await request.json()
    const { reason } = body

    const result = await customerDirectCancel(choreId, customer.id, reason)

    return NextResponse.json({
      chore: result.chore,
      cancellationRequest: result.request,
    })
  } catch (error: any) {
    console.error('Error cancelling chore:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    if (error.message.includes('Only the chore owner')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    if (error.message.includes('must be DRAFT or PUBLISHED')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel chore' },
      { status: 400 }
    )
  }
}

