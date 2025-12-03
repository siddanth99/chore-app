import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getHttpStatusForAuthError, isAuthError } from '@/server/auth/role'
import { UserRole } from '@prisma/client'
import { customerDirectCancel } from '@/server/api/cancellations'

/**
 * POST /api/chores/[choreId]/cancel
 * Cancel a chore (CUSTOMER only)
 * Security: customerId always comes from session
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    // RBAC: Only customers can cancel chores
    const customer = await requireRole(UserRole.CUSTOMER)
    const { choreId } = await context.params
    const body = await request.json()
    const { reason } = body

    // Security: customerId comes from session, not from client
    const result = await customerDirectCancel(choreId, customer.id, reason)

    return NextResponse.json({
      chore: result.chore,
      cancellationRequest: result.request,
    })
  } catch (error: any) {
    console.error('Error cancelling chore:', error)
    
    // Handle structured auth/business errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Operation failed' },
        { status }
      )
    }
    
    // Generic 500 for unknown errors (don't leak details)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

