import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'
import { isRouteMockEnabled, isRouteLiveEnabled } from '@/lib/paymentsConfig'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

/**
 * POST /api/chores/[choreId]/approve
 * 
 * Client approves completion and releases payment.
 * 
 * State machine: COMPLETED → CLOSED
 * 
 * Requirements:
 * - User must be the chore owner (client)
 * - Chore status must be COMPLETED
 * 
 * Note: Worker payout will be implemented in a future step
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { choreId } = await context.params

    // Fetch chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      )
    }

    // Verify user is the chore owner
    if (chore.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Only the chore owner can approve completion' },
        { status: 403 }
      )
    }

    // Verify chore status is COMPLETED
    if (chore.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Cannot approve chore. Chore status must be COMPLETED, but it is ${chore.status}` },
        { status: 400 }
      )
    }

    // Check if there's an open dispute for this chore
    const openDispute = await prisma.dispute.findFirst({
      where: {
        choreId,
        status: {
          in: ['OPEN', 'IN_REVIEW'],
        },
      },
    })

    if (openDispute) {
      return NextResponse.json(
        {
          error: 'Cannot approve while dispute is open. Please resolve the dispute first.',
          disputeId: openDispute.id,
        },
        { status: 400 }
      )
    }

    // Find the associated payment record to get transferId
    const payment = await prisma.razorpayPayment.findFirst({
      where: {
        choreId,
        status: 'SUCCESS', // Only release if payment was successful
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Release payout if transfer exists
    if (payment?.transferId) {
      // MOCK MODE: Pretend payout release succeeded
      if (isRouteMockEnabled()) {
        // Update payment meta to record mock release
        await prisma.razorpayPayment.update({
          where: { id: payment.id },
          data: {
            meta: {
              ...((payment.meta as Record<string, any>) || {}),
              mockRelease: true,
              mockReleaseAt: new Date().toISOString(),
              releasedBy: user.id,
            },
          },
        })

        console.log('Payout released (mock mode):', payment.transferId)
      }
      // LIVE MODE: Call real Razorpay transfer release API
      else if (isRouteLiveEnabled() && KEY_ID && KEY_SECRET) {
        try {
          // Use direct HTTP call to Razorpay API for transfer release
          const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

          const releaseRes = await fetch(`https://api.razorpay.com/v1/transfers/${payment.transferId}/release`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
          })

          if (releaseRes.ok) {
            // Update payment meta to record release
            await prisma.razorpayPayment.update({
              where: { id: payment.id },
              data: {
                meta: {
                  ...((payment.meta as Record<string, any>) || {}),
                  releaseAt: new Date().toISOString(),
                  releasedBy: user.id,
                },
              },
            })

            console.log('Payout released successfully:', payment.transferId)
          } else {
            const errorText = await releaseRes.text()
            console.error('Failed to release payout:', errorText)
            // Don't fail the approval if release fails - can be retried later
          }
        } catch (error: any) {
          console.error('Error releasing payout:', error)
          // Log error but don't fail the approval
          // The payout can be released manually later if needed
        }
      }
    } else if (payment && !payment.transferId) {
      console.warn('Payment record exists but no transferId found:', payment.id)
    }

    // Update chore: change status to CLOSED
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        ok: true,
        mode: isRouteMockEnabled() ? 'mock' : 'live',
        chore: updatedChore,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error approving chore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

