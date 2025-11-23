import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/server/auth/role'
import { UserRole, ChoreStatus, PaymentDirection, PaymentMethod, NotificationType } from '@prisma/client'
import { recordPayment } from '@/server/api/payments'
import { createNotification } from '@/server/api/notifications'
import { prisma } from '@/server/db/client'

// Next.js 15+ — dynamic route params are a Promise and must be awaited
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    // Ensure only customers can add payments
    const user = await requireRole(UserRole.CUSTOMER)

    // Unwrap params promise
    const { choreId } = await context.params

    if (!choreId) {
      return NextResponse.json({ error: 'Missing choreId' }, { status: 400 })
    }

    // Load chore with necessary fields
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
      select: {
        id: true,
        title: true,            // 👈 add this line
        createdById: true,
        assignedWorkerId: true,
        agreedPrice: true,
        status: true,
      },
    })

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    // Validate user is the owner
    if (chore.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Only the chore owner can record payments' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { amount, direction, method, notes } = body

    // Validate amount
    const amountNumber = typeof amount === 'number' ? amount : parseFloat(amount)
    if (!amountNumber || amountNumber <= 0 || isNaN(amountNumber)) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Validate direction
    if (
      direction !== PaymentDirection.CUSTOMER_TO_OWNER &&
      direction !== PaymentDirection.OWNER_TO_WORKER
    ) {
      return NextResponse.json({ error: 'Invalid payment direction' }, { status: 400 })
    }

    // Validate method
    const validMethods: PaymentMethod[] = [
      PaymentMethod.CASH,
      PaymentMethod.UPI,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CARD,
      PaymentMethod.OTHER,
    ]
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Validate chore status (allow ASSIGNED, IN_PROGRESS, COMPLETED)
    if (
      chore.status === ChoreStatus.CANCELLED ||
      chore.status === ChoreStatus.DRAFT ||
      chore.status === ChoreStatus.PUBLISHED ||
      chore.status === ChoreStatus.CANCELLATION_REQUESTED
    ) {
      return NextResponse.json(
        {
          error: `Payments cannot be recorded for chores with status: ${chore.status}`,
        },
        { status: 400 }
      )
    }

    // Validate OWNER_TO_WORKER requires assigned worker
    if (direction === PaymentDirection.OWNER_TO_WORKER && !chore.assignedWorkerId) {
      return NextResponse.json(
        { error: 'Cannot pay worker: no worker assigned to this chore' },
        { status: 400 }
      )
    }

    // Determine fromUserId and toUserId
    let fromUserId: string
    let toUserId: string

    if (direction === PaymentDirection.CUSTOMER_TO_OWNER) {
      // Customer paying to owner/platform (for now, same as createdById for bookkeeping)
      fromUserId = chore.createdById
      toUserId = chore.createdById
    } else {
      // Owner paying to worker
      fromUserId = chore.createdById
      toUserId = chore.assignedWorkerId!
    }

    // Record the payment (this will automatically recompute paymentStatus)
    const payment = await recordPayment({
      choreId: chore.id,
      fromUserId,
      toUserId,
      amount: amountNumber,
      direction,
      method,
      notes: notes || undefined,
    })

    // Notify worker if payment is to them
    if (direction === PaymentDirection.OWNER_TO_WORKER && chore.assignedWorkerId) {
      await createNotification({
        userId: chore.assignedWorkerId,
        type: NotificationType.PAYMENT_RECORDED,
        choreId: chore.id,
        paymentId: payment.id,
        title: 'Payment received',
        message: `You received $${amountNumber} for "${chore.title}"`,
        link: `/chores/${chore.id}`,
      })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 400 }
    )
  }
}

