import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { DisputeStatus, ChoreStatus, ChorePaymentStatus } from '@prisma/client'
import { isRouteMockEnabled, isRouteLiveEnabled } from '@/lib/paymentsConfig'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

type ResolveDisputeParams = {
  disputeId: string
}

type ResolveAction = 'REFUND_CLIENT' | 'PAY_WORKER' | 'MANUAL'

/**
 * POST /api/disputes/[disputeId]/resolve
 * 
 * Admin-only route to resolve disputes.
 * 
 * Actions:
 * - REFUND_CLIENT: Refund payment to client, mark chore as CANCELED
 * - PAY_WORKER: Release payout to worker, mark chore as CLOSED
 * - MANUAL: Manual resolution (just close dispute)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ disputeId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can resolve disputes
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can resolve disputes' },
        { status: 403 }
      )
    }

    const { disputeId } = await context.params

    const body = await req.json().catch(() => null)
    const {
      action,
      amountRefunded,
      workerPayoutAdjustment,
      resolution,
    }: {
      action?: ResolveAction
      amountRefunded?: number
      workerPayoutAdjustment?: number
      resolution?: string
    } = body ?? {}

    if (!action || !['REFUND_CLIENT', 'PAY_WORKER', 'MANUAL'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be REFUND_CLIENT, PAY_WORKER, or MANUAL' },
        { status: 400 }
      )
    }

    // Fetch dispute with related chore and payment
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        chore: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            assignedWorkerId: true,
          },
        },
      },
    })

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.IN_REVIEW) {
      return NextResponse.json(
        { error: `Dispute is not open. Current status: ${dispute.status}` },
        { status: 400 }
      )
    }

    // Find associated payment
    const payment = await prisma.razorpayPayment.findFirst({
      where: {
        choreId: dispute.choreId,
        status: 'SUCCESS',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let newDisputeStatus: DisputeStatus
    let choreStatusUpdate: ChoreStatus | null = null
    let chorePaymentStatusUpdate: ChorePaymentStatus | null = null

    // Handle refund action
    if (action === 'REFUND_CLIENT') {
      newDisputeStatus = DisputeStatus.RESOLVED_REFUND_CLIENT
      choreStatusUpdate = ChoreStatus.CANCELED
      chorePaymentStatusUpdate = ChorePaymentStatus.REFUNDED

      // Process refund (mock or live)
      if (payment) {
        if (isRouteMockEnabled()) {
          // Mock mode: Just update meta
          await prisma.razorpayPayment.update({
            where: { id: payment.id },
            data: {
              status: 'REFUNDED',
              meta: {
                ...((payment.meta as Record<string, any>) || {}),
                mockRefundAt: new Date().toISOString(),
                refundReason: 'Dispute resolution',
                refundAmount: amountRefunded ?? payment.amount,
              },
            },
          })
        } else if (isRouteLiveEnabled() && KEY_ID && KEY_SECRET && payment.razorpayPaymentId) {
          // Live mode: Call Razorpay Refund API
          try {
            const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
            const refundAmount = amountRefunded ?? payment.amount

            const refundRes = await fetch(
              `https://api.razorpay.com/v1/payments/${payment.razorpayPaymentId}/refund`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${auth}`,
                },
                body: JSON.stringify({
                  amount: refundAmount,
                  notes: {
                    reason: 'Dispute resolution',
                    disputeId: dispute.id,
                  },
                }),
              }
            )

            if (refundRes.ok) {
              const refundData = await refundRes.json()
              await prisma.razorpayPayment.update({
                where: { id: payment.id },
                data: {
                  status: 'REFUNDED',
                  meta: {
                    ...((payment.meta as Record<string, any>) || {}),
                    refundId: refundData.id,
                    refundAt: new Date().toISOString(),
                    refundAmount: refundData.amount,
                    refundReason: 'Dispute resolution',
                  },
                },
              })
            } else {
              const errorText = await refundRes.text()
              console.error('Razorpay refund failed:', errorText)
              // Continue with dispute resolution even if refund API fails
              // Admin can manually process refund
            }
          } catch (error: any) {
            console.error('Error processing Razorpay refund:', error)
            // Continue with dispute resolution
          }
        }
      }
    }
    // Handle pay worker action
    else if (action === 'PAY_WORKER') {
      newDisputeStatus = DisputeStatus.RESOLVED_PAY_WORKER
      choreStatusUpdate = ChoreStatus.CLOSED

      // Release payout if transfer exists
      if (payment?.transferId) {
        if (isRouteMockEnabled()) {
          // Mock mode: Just update meta
          await prisma.razorpayPayment.update({
            where: { id: payment.id },
            data: {
              meta: {
                ...((payment.meta as Record<string, any>) || {}),
                mockReleaseAt: new Date().toISOString(),
                releasedBy: user.id,
                disputeResolution: true,
              },
            },
          })
        } else if (isRouteLiveEnabled() && KEY_ID && KEY_SECRET) {
          // Live mode: Release transfer
          try {
            const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
            const releaseRes = await fetch(
              `https://api.razorpay.com/v1/transfers/${payment.transferId}/release`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${auth}`,
                },
              }
            )

            if (releaseRes.ok) {
              await prisma.razorpayPayment.update({
                where: { id: payment.id },
                data: {
                  meta: {
                    ...((payment.meta as Record<string, any>) || {}),
                    releaseAt: new Date().toISOString(),
                    releasedBy: user.id,
                    disputeResolution: true,
                  },
                },
              })
            } else {
              const errorText = await releaseRes.text()
              console.error('Failed to release payout:', errorText)
            }
          } catch (error: any) {
            console.error('Error releasing payout:', error)
          }
        }
      }

      // Update chore
      await prisma.chore.update({
        where: { id: dispute.choreId },
        data: {
          status: ChoreStatus.CLOSED,
          closedAt: new Date(),
        },
      })
    }
    // Handle manual action
    else {
      newDisputeStatus = DisputeStatus.RESOLVED_MANUAL
      // Don't update chore status for manual resolution
    }

    // Update dispute
    const updatedDispute = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: newDisputeStatus,
          resolution: resolution?.trim() || null,
          amountRefunded: amountRefunded ?? null,
          workerPayoutAdjustment: workerPayoutAdjustment ?? null,
          resolvedAt: new Date(),
        },
        include: {
          chore: {
            select: {
              id: true,
              title: true,
              status: true,
              paymentStatus: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Update chore status if needed
      if (choreStatusUpdate) {
        await tx.chore.update({
          where: { id: dispute.choreId },
          data: {
            status: choreStatusUpdate,
            ...(chorePaymentStatusUpdate ? { paymentStatus: chorePaymentStatusUpdate } : {}),
            ...(choreStatusUpdate === ChoreStatus.CLOSED ? { closedAt: new Date() } : {}),
          },
        })
      }

      return updated
    })

    return NextResponse.json(
      {
        dispute: updatedDispute,
        message: 'Dispute resolved successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

