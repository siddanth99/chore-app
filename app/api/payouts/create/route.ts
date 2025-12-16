import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { createWorkerPayout } from '@/server/api/payouts'

/**
 * POST /api/payouts/create
 * 
 * Create a worker payout for a completed chore.
 * 
 * Requirements:
 * - User must be authenticated (can be customer or system trigger)
 * - Chore must exist
 * - Chore must be COMPLETED
 * - Chore paymentStatus must be FUNDED
 * - Worker must be assigned and have upiId
 * - No existing pending/successful payout for this chore
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { choreId } = await request.json()

    if (!choreId) {
      return NextResponse.json(
        { error: 'choreId is required' },
        { status: 400 }
      )
    }

    // Call server-side helper function
    const result = await createWorkerPayout(choreId)

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 
                        result.error?.includes('must be') || result.error?.includes('has no') ? 400 : 500
      return NextResponse.json(
        { error: result.error, payoutId: result.payoutId },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        payout: result.payout,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in /api/payouts/create:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

