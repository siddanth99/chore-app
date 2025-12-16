import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { createRazorpayPayout } from '@/lib/razorpay-payout'

/**
 * POST /api/payouts/retry
 * 
 * Retry a failed worker payout.
 * 
 * Requirements:
 * - User must be authenticated (can be customer, worker, or admin)
 * - Payout must exist and be in FAILED status
 * - Worker must still have upiId
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

    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json(
        { error: 'payoutId is required' },
        { status: 400 }
      )
    }

    // Fetch payout with chore and worker details
    const payout = await prisma.workerPayout.findUnique({
      where: { id: payoutId },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            status: true,
            paymentStatus: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            upiId: true,
            email: true,
          },
        },
      },
    })

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Only allow retrying failed payouts
    if (payout.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Cannot retry payout. Current status: ${payout.status}. Only FAILED payouts can be retried.` },
        { status: 400 }
      )
    }

    // Validate worker has UPI ID
    if (!payout.worker.upiId) {
      return NextResponse.json(
        { error: 'Worker has not configured UPI ID for payouts' },
        { status: 400 }
      )
    }

    // Generate new reference ID for retry
    const referenceId = `chore_${payout.choreId}_${payout.id}_retry_${Date.now()}`

    try {
      // Call Razorpay to create payout
      const razorpayResponse = await createRazorpayPayout(
        payout.worker.upiId,
        payout.worker.name || 'Worker',
        payout.amount,
        referenceId
      )

      // Update payout record with Razorpay response
      const updatedPayout = await prisma.workerPayout.update({
        where: { id: payoutId },
        data: {
          razorpayPayoutId: razorpayResponse.id,
          status: razorpayResponse.status === 'queued' || razorpayResponse.status === 'processing' ? 'PENDING' : 
                  razorpayResponse.status === 'processed' || razorpayResponse.status === 'completed' ? 'SUCCESS' : 
                  razorpayResponse.status === 'failed' || razorpayResponse.status === 'reversed' ? 'FAILED' : 'PENDING',
          errorMessage: razorpayResponse.status === 'failed' || razorpayResponse.status === 'reversed' 
            ? `Razorpay status: ${razorpayResponse.status}` 
            : null,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json(
        {
          success: true,
          payout: updatedPayout,
          razorpayResponse,
        },
        { status: 200 }
      )
    } catch (razorpayError: any) {
      // Update payout record with new error
      const errorMessage = razorpayError.message || 'Unknown error creating payout'
      
      await prisma.workerPayout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          errorMessage,
          updatedAt: new Date(),
        },
      })

      console.error('Error retrying Razorpay payout:', razorpayError)

      return NextResponse.json(
        { 
          error: 'Failed to retry payout',
          details: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in /api/payouts/retry:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

