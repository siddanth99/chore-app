/**
 * Server-side payout creation helper
 * 
 * This can be called directly from server-side code (e.g., in API routes)
 * without making HTTP calls to the API endpoint.
 */

import { prisma } from '@/server/db/client'
import { ChoreStatus, ChorePaymentStatus } from '@prisma/client'
import { createRazorpayPayout } from '@/lib/razorpay-payout'

/**
 * Create a worker payout for a completed chore
 * 
 * @param choreId - The chore ID to create payout for
 * @returns Payout record or error details
 */
export async function createWorkerPayout(choreId: string): Promise<{
  success: boolean
  payout?: any
  error?: string
  payoutId?: string
}> {
  try {
    // Fetch chore with worker details
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            upiId: true,
            email: true,
          },
        },
        workerPayouts: {
          where: {
            status: {
              in: ['PENDING', 'SUCCESS'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!chore) {
      return { success: false, error: 'Chore not found' }
    }

    // Validate chore status
    if (chore.status !== ChoreStatus.COMPLETED) {
      return { 
        success: false, 
        error: `Chore must be COMPLETED to create payout. Current status: ${chore.status}` 
      }
    }

    // Validate payment status
    if (chore.paymentStatus !== ChorePaymentStatus.FUNDED) {
      return { 
        success: false, 
        error: `Chore payment must be FUNDED to create payout. Current status: ${chore.paymentStatus}` 
      }
    }

    // Validate worker assigned
    if (!chore.assignedWorkerId) {
      return { success: false, error: 'Chore has no assigned worker' }
    }

    if (!chore.assignedWorker) {
      return { success: false, error: 'Assigned worker not found' }
    }

    // Validate worker has UPI ID
    if (!chore.assignedWorker.upiId) {
      return { success: false, error: 'Worker has not configured UPI ID for payouts' }
    }

    // Check if payout already exists
    if (chore.workerPayouts && chore.workerPayouts.length > 0) {
      const existingPayout = chore.workerPayouts[0]
      if (existingPayout.status === 'SUCCESS') {
        return { 
          success: false, 
          error: 'Payout already completed for this chore',
          payoutId: existingPayout.id 
        }
      }
      if (existingPayout.status === 'PENDING') {
        return { 
          success: false, 
          error: 'Payout already pending for this chore',
          payoutId: existingPayout.id 
        }
      }
    }

    // Get the payment amount from the RazorpayPayment record
    const payment = await prisma.razorpayPayment.findFirst({
      where: {
        choreId,
        status: 'SUCCESS',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!payment) {
      return { success: false, error: 'No successful payment found for this chore' }
    }

    // Use workerPayout from payment, or calculate it (90% of total)
    const amountInPaise = payment.workerPayout || Math.round(payment.amount * 0.9)

    if (amountInPaise <= 0) {
      return { success: false, error: 'Invalid payout amount' }
    }

    // Create payout record first (with PENDING status)
    const payoutRecord = await prisma.workerPayout.create({
      data: {
        choreId,
        workerId: chore.assignedWorkerId,
        amount: amountInPaise,
        status: 'PENDING',
      },
    })

    // Generate unique reference ID for idempotency
    const referenceId = `chore_${choreId}_${payoutRecord.id}_${Date.now()}`

    // SIMULATION MODE: If enabled, skip Razorpay call and mark as SUCCESS immediately
    // This is for dev/testing only and should be disabled in production
    const SIMULATED_PAYOUTS = process.env.RAZORPAY_SIMULATED_PAYOUTS === 'true'

    if (SIMULATED_PAYOUTS) {
      // Create a simulated successful payout without calling Razorpay
      const simulatedPayout = await prisma.workerPayout.update({
        where: { id: payoutRecord.id },
        data: {
          razorpayPayoutId: `SIMULATED_PAYOUT_${payoutRecord.id}`,
          status: 'SUCCESS',
          errorMessage: null,
        },
      })

      console.log('[SIMULATED_PAYOUT] Created simulated payout', {
        choreId,
        workerId: chore.assignedWorkerId,
        amountInPaise,
        payoutId: payoutRecord.id,
      })

      return { success: true, payout: simulatedPayout }
    }

    try {
      // Call Razorpay to create payout
      const razorpayResponse = await createRazorpayPayout(
        chore.assignedWorker.upiId,
        chore.assignedWorker.name || 'Worker',
        amountInPaise,
        referenceId
      )

      // Update payout record with Razorpay response
      const updatedPayout = await prisma.workerPayout.update({
        where: { id: payoutRecord.id },
        data: {
          razorpayPayoutId: razorpayResponse.id,
          status: razorpayResponse.status === 'queued' || razorpayResponse.status === 'processing' ? 'PENDING' : 
                  razorpayResponse.status === 'processed' || razorpayResponse.status === 'completed' ? 'SUCCESS' : 
                  razorpayResponse.status === 'failed' || razorpayResponse.status === 'reversed' ? 'FAILED' : 'PENDING',
          errorMessage: razorpayResponse.status === 'failed' || razorpayResponse.status === 'reversed' 
            ? `Razorpay status: ${razorpayResponse.status}` 
            : null,
        },
      })

      return { success: true, payout: updatedPayout }
    } catch (razorpayError: any) {
      // Update payout record with error
      const errorMessage = razorpayError.message || 'Unknown error creating payout'
      
      await prisma.workerPayout.update({
        where: { id: payoutRecord.id },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      })

      console.error('Error creating Razorpay payout:', razorpayError)

      return { 
        success: false, 
        error: 'Failed to create payout',
        payoutId: payoutRecord.id 
      }
    }
  } catch (error: any) {
    console.error('Error in createWorkerPayout:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

