import { prisma } from '../db/client'
import { PaymentStatus, PayoutStatus, ChoreStatus } from '@prisma/client'

/**
 * Customer Payments Dashboard Data
 */
export interface CustomerPaymentsDashboard {
  summary: {
    totalSpent: number // in rupees
    activeChoresCount: number
    refundedAmount: number // in rupees
    disputesCount: number
  }
  payments: Array<{
    id: string
    choreTitle: string
    worker: string
    workerId: string
    amount: number // in rupees
    status: 'funded' | 'pending' | 'success' | 'refunded'
    method: string
    date: string
    choreId: string
    createdAt: Date
  }>
}

/**
 * Get customer payments dashboard data
 */
export async function getCustomerPaymentsDashboard(
  userId: string
): Promise<CustomerPaymentsDashboard> {
  // Get all payments for this customer
  const payments = await prisma.razorpayPayment.findMany({
    where: {
      userId,
    },
    include: {
      chore: {
        include: {
          assignedWorker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate summary
  const totalSpent = payments
    .filter((p) => p.status === PaymentStatus.SUCCESS)
    .reduce((sum, p) => sum + p.amount, 0) / 100 // Convert paise to rupees

  const activeChores = await prisma.chore.count({
    where: {
      createdById: userId,
      status: {
        in: [ChoreStatus.ASSIGNED, ChoreStatus.FUNDED, ChoreStatus.IN_PROGRESS],
      },
    },
  })

  const refundedAmount = payments
    .filter((p) => p.status === PaymentStatus.REFUNDED)
    .reduce((sum, p) => sum + p.amount, 0) / 100

  const disputesCount = await prisma.dispute.count({
    where: {
      userId,
      status: 'OPEN',
    },
  })

  // Transform payments for UI
  const transformedPayments = payments.map((payment) => {
    const statusMap: Record<PaymentStatus, 'funded' | 'pending' | 'success' | 'refunded'> = {
      PENDING: 'pending',
      SUCCESS: 'success',
      FAILED: 'pending',
      REFUNDED: 'refunded',
    }

    // If payment status is SUCCESS and chore paymentStatus is FUNDED, show as 'funded'
    const status =
      payment.status === PaymentStatus.SUCCESS &&
      payment.chore?.paymentStatus === 'FUNDED'
        ? 'funded'
        : statusMap[payment.status] || 'pending'

    return {
      id: payment.id,
      choreTitle: payment.chore?.title || 'Unknown Chore',
      worker: payment.chore?.assignedWorker?.name || 'Unassigned',
      workerId: payment.chore?.assignedWorker?.id || '',
      amount: payment.amount / 100, // Convert paise to rupees
      status,
      method: 'UPI', // TODO: Store payment method in RazorpayPayment if available
      date: new Date(payment.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      choreId: payment.choreId || '',
      createdAt: payment.createdAt,
    }
  })

  return {
    summary: {
      totalSpent,
      activeChoresCount: activeChores,
      refundedAmount,
      disputesCount,
    },
    payments: transformedPayments,
  }
}

/**
 * Worker Earnings Dashboard Data
 */
export interface WorkerEarningsDashboard {
  summary: {
    totalEarned: number // in rupees
    pendingPayouts: number // in rupees
    last30Days: number // in rupees
  }
  payouts: Array<{
    id: string
    choreTitle: string
    amount: number // in rupees
    status: 'pending' | 'success' | 'failed'
    date: string
    errorMessage?: string
    createdAt: Date
  }>
  chartData: Array<{
    week: string
    earnings: number // in rupees
  }>
}

/**
 * Get worker earnings dashboard data
 */
export async function getWorkerEarningsDashboard(
  workerId: string
): Promise<WorkerEarningsDashboard> {
  // Get all payouts for this worker
  const payouts = await prisma.workerPayout.findMany({
    where: {
      workerId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate summary
  const totalEarned =
    payouts
      .filter((p) => p.status === PayoutStatus.SUCCESS)
      .reduce((sum, p) => sum + p.amount, 0) / 100 // Convert paise to rupees

  const pendingPayouts =
    payouts
      .filter((p) => p.status === PayoutStatus.PENDING)
      .reduce((sum, p) => sum + p.amount, 0) / 100

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const last30Days =
    payouts
      .filter(
        (p) =>
          p.status === PayoutStatus.SUCCESS &&
          p.createdAt >= thirtyDaysAgo
      )
      .reduce((sum, p) => sum + p.amount, 0) / 100

  // Transform payouts for UI
  const transformedPayouts = payouts.map((payout) => {
    const statusMap: Record<PayoutStatus, 'pending' | 'success' | 'failed'> = {
      PENDING: 'pending',
      SUCCESS: 'success',
      FAILED: 'failed',
    }

    return {
      id: payout.id,
      choreTitle: payout.chore.title,
      amount: payout.amount / 100, // Convert paise to rupees
      status: statusMap[payout.status],
      date: new Date(payout.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      errorMessage: payout.errorMessage || undefined,
      createdAt: payout.createdAt,
    }
  })

  // Generate chart data (earnings per week for last 12 weeks)
  const chartData: Array<{ week: string; earnings: number }> = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekEarnings =
      payouts
        .filter(
          (p) =>
            p.status === PayoutStatus.SUCCESS &&
            p.createdAt >= weekStart &&
            p.createdAt < weekEnd
        )
        .reduce((sum, p) => sum + p.amount, 0) / 100

    chartData.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      earnings: weekEarnings,
    })
  }

  return {
    summary: {
      totalEarned,
      pendingPayouts,
      last30Days,
    },
    payouts: transformedPayouts,
    chartData,
  }
}

/**
 * Admin Payments Dashboard Data
 */
export interface AdminPaymentsDashboard {
  summary: {
    totalPayments: number
    totalVolume: number // in rupees
    successfulPayments: number
  }
  payments: Array<{
    id: string
    amount: number // in rupees
    status: string
    customer: string
    customerId: string
    worker: string | null
    workerId: string | null
    choreTitle: string | null
    choreId: string | null
    method: string
    createdAt: Date
  }>
}

/**
 * Get admin payments dashboard data
 */
export async function getAdminPaymentsDashboard(): Promise<AdminPaymentsDashboard> {
  const payments = await prisma.razorpayPayment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chore: {
        include: {
          assignedWorker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Limit for performance
  })

  const totalPayments = payments.length
  const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0) / 100
  const successfulPayments = payments.filter((p) => p.status === PaymentStatus.SUCCESS).length

  const transformedPayments = payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount / 100,
    status: payment.status,
    customer: payment.user.name,
    customerId: payment.user.id,
    worker: payment.chore?.assignedWorker?.name || null,
    workerId: payment.chore?.assignedWorker?.id || null,
    choreTitle: payment.chore?.title || null,
    choreId: payment.choreId,
    method: 'UPI', // TODO: Store payment method if available
    createdAt: payment.createdAt,
  }))

  return {
    summary: {
      totalPayments,
      totalVolume,
      successfulPayments,
    },
    payments: transformedPayments,
  }
}

/**
 * Admin Payouts Dashboard Data
 */
export interface AdminPayoutsDashboard {
  summary: {
    totalPayouts: number
    totalAmount: number // in rupees
    failedCount: number
    pendingCount: number
  }
  payouts: Array<{
    id: string
    worker: string
    workerId: string
    choreTitle: string
    choreId: string
    amount: number // in rupees
    status: string
    errorMessage: string | null
    createdAt: Date
  }>
}

/**
 * Get admin payouts dashboard data
 */
export async function getAdminPayoutsDashboard(): Promise<AdminPayoutsDashboard> {
  const payouts = await prisma.workerPayout.findMany({
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Limit for performance
  })

  const totalPayouts = payouts.length
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0) / 100
  const failedCount = payouts.filter((p) => p.status === PayoutStatus.FAILED).length
  const pendingCount = payouts.filter((p) => p.status === PayoutStatus.PENDING).length

  const transformedPayouts = payouts.map((payout) => ({
    id: payout.id,
    worker: payout.worker.name,
    workerId: payout.worker.id,
    choreTitle: payout.chore.title,
    choreId: payout.choreId,
    amount: payout.amount / 100,
    status: payout.status,
    errorMessage: payout.errorMessage,
    createdAt: payout.createdAt,
  }))

  return {
    summary: {
      totalPayouts,
      totalAmount,
      failedCount,
      pendingCount,
    },
    payouts: transformedPayouts,
  }
}


