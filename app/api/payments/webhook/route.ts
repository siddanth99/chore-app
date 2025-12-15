import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/server/db/client'

// Vercel Serverless Function configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

/**
 * Razorpay Webhook Handler
 * 
 * Handles Razorpay webhook events for payment status updates.
 * Important: Must use raw body for signature verification.
 * 
 * Supported events:
 * - payment.captured: Payment successfully captured
 * - payment.failed: Payment failed
 * - payment.authorized: Payment authorized (may be handled but not required)
 * - refund.processed: Refund processed (for future use)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validate webhook secret is configured
    if (!WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // 2. Read raw body (required for signature verification)
    // IMPORTANT: Do NOT use req.json() - we need the raw body as a string
    const rawBody = await req.text()

    if (!rawBody) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    // 3. Get and validate signature header
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('Missing x-razorpay-signature header')
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      )
    }

    // 4. Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature', {
        expected: expectedSignature.slice(0, 20) + '...',
        received: signature.slice(0, 20) + '...',
      })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // 5. Parse event payload (after signature verification)
    let event: any
    try {
      event = JSON.parse(rawBody)
    } catch (error) {
      console.error('Failed to parse webhook payload as JSON:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const eventType = event.event
    console.log('Razorpay webhook received:', {
      event: eventType,
      orderId: event.payload?.payment?.entity?.order_id,
      paymentId: event.payload?.payment?.entity?.id,
    })

    // 6. Extract payment entity from event payload
    const payment = event.payload?.payment?.entity

    if (!payment) {
      console.warn('Webhook event missing payment entity:', eventType)
      // Return 200 to prevent Razorpay retries
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const orderId = payment.order_id
    const paymentId = payment.id
    const paymentStatus = payment.status

    if (!orderId) {
      console.warn('Webhook event missing order_id')
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 7. Look up RazorpayPayment record in database
    const record = await prisma.razorpayPayment.findUnique({
      where: { razorpayOrderId: orderId },
    })

    if (!record) {
      console.warn('RazorpayPayment record not found for order:', orderId)
      // Return 200 to prevent Razorpay from retrying endlessly
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 8. Handle different event types
    switch (eventType) {
      case 'payment.captured': {
        // Idempotency check: if already SUCCESS, skip update
        if (record.status === 'SUCCESS') {
          console.log('Payment already marked as SUCCESS, skipping update:', orderId)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        // Update RazorpayPayment to SUCCESS
        // Note: transferId should already be stored from create-order response
        // If not, we can extract it from the payment entity if available
        let transferId = record.transferId
        if (!transferId && payment.transfers && payment.transfers.length > 0) {
          transferId = payment.transfers[0].id || null
        }

        await prisma.razorpayPayment.update({
          where: { razorpayOrderId: orderId },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: paymentId,
            razorpaySignature: signature, // Store webhook signature for audit
            transferId: transferId || record.transferId, // Update if found in payment response
            meta: {
              ...(record.meta as Record<string, any> || {}),
              webhookCapturedAt: new Date().toISOString(),
              webhookEventType: eventType,
            },
          },
        })

        console.log('Payment marked as SUCCESS:', {
          orderId,
          paymentId,
        })

        // Update Chore paymentStatus and status to FUNDED if choreId exists
        if (record.choreId) {
          await prisma.chore.update({
            where: { id: record.choreId },
            data: {
              paymentStatus: 'FUNDED',
              status: 'FUNDED', // Escrow funded - ready for worker to start
            },
          })
          console.log('Chore payment status updated to FUNDED:', record.choreId)
        }

        return NextResponse.json({ received: true }, { status: 200 })
      }

      case 'payment.failed': {
        // Idempotency check: if already FAILED with same reason, skip
        const failedReason = payment.error_description || payment.error_code || 'Payment failed'
        const existingMeta = record.meta as Record<string, any> || {}
        if (record.status === 'FAILED' && existingMeta.failedReason === failedReason) {
          console.log('Payment already marked as FAILED with same reason, skipping update:', orderId)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        // Update RazorpayPayment to FAILED
        await prisma.razorpayPayment.update({
          where: { razorpayOrderId: orderId },
          data: {
            status: 'FAILED',
            meta: {
              ...existingMeta,
              failedReason,
              errorCode: payment.error_code || null,
              webhookFailedAt: new Date().toISOString(),
              webhookEventType: eventType,
            },
          },
        })

        console.log('Payment marked as FAILED:', {
          orderId,
          paymentId,
          reason: failedReason,
        })

        // Update Chore paymentStatus to UNPAID if choreId exists
        if (record.choreId) {
          await prisma.chore.update({
            where: { id: record.choreId },
            data: { paymentStatus: 'UNPAID' },
          })
          console.log('Chore payment status updated to UNPAID:', record.choreId)
        }

        return NextResponse.json({ received: true }, { status: 200 })
      }

      case 'payment.authorized': {
        // Payment authorized but not yet captured
        // We can log this but don't change status (wait for payment.captured)
        console.log('Payment authorized (not yet captured):', {
          orderId,
          paymentId,
        })

        // Optionally update meta to track authorization
        await prisma.razorpayPayment.update({
          where: { razorpayOrderId: orderId },
          data: {
            meta: {
              ...(record.meta as Record<string, any> || {}),
              webhookAuthorizedAt: new Date().toISOString(),
              webhookEventType: eventType,
            },
          },
        })

        return NextResponse.json({ received: true }, { status: 200 })
      }

      case 'refund.processed': {
        // Handle refund (for future use)
        console.log('Refund processed:', {
          orderId,
          paymentId,
        })

        // Update RazorpayPayment to REFUNDED
        await prisma.razorpayPayment.update({
          where: { razorpayOrderId: orderId },
          data: {
            status: 'REFUNDED',
            meta: {
              ...(record.meta as Record<string, any> || {}),
              webhookRefundedAt: new Date().toISOString(),
              webhookEventType: eventType,
            },
          },
        })

        // Update Chore paymentStatus to REFUNDED if choreId exists
        if (record.choreId) {
          await prisma.chore.update({
            where: { id: record.choreId },
            data: { paymentStatus: 'REFUNDED' },
          })
        }

        return NextResponse.json({ received: true }, { status: 200 })
      }

      default: {
        // Unknown event type - log but don't error
        console.log('Unhandled webhook event type:', eventType, {
          orderId,
          paymentId,
        })
        return NextResponse.json({ received: true }, { status: 200 })
      }
    }
  } catch (error) {
    // Log error but return 200 to prevent Razorpay from retrying endlessly
    // In production, you might want to send to error tracking service (e.g., Sentry)
    console.error('Error processing Razorpay webhook:', error)
    // Return 200 to acknowledge receipt and prevent retries
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

