// web/server/api/payments.ts
import { prisma } from '../db/client'
import {
  ChorePaymentStatus,
  PaymentDirection,
  PaymentMethod,
  ChoreStatus,
  UserRole,
} from '@prisma/client'

export interface RecordPaymentInput {
  choreId: string
  fromUserId: string
  toUserId: string
  amount: number
  direction: PaymentDirection
  method: PaymentMethod
  notes?: string
}

/**
 * Record a payment for a chore
 */
export async function recordPayment(input: RecordPaymentInput) {
  // Create payment row
  const payment = await prisma.payment.create({
    data: {
      choreId: input.choreId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amount: input.amount,
      direction: input.direction,
      method: input.method,
      notes: input.notes ?? null,
    },
  })

  // Recompute summary and update chore.paymentStatus + agreedPrice if needed
  await recomputeChorePaymentStatus(input.choreId)

  return payment
}

/**
 * Get all payments for a specific chore
 */
export async function getPaymentsForChore(choreId: string) {
  return prisma.payment.findMany({
    where: { choreId },
    orderBy: { createdAt: 'asc' },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
  })
}

/**
 * Get payment summary for a chore
 */
export async function getPaymentSummaryForChore(choreId: string) {
  const payments = await prisma.payment.groupBy({
    by: ['direction'],
    where: { choreId },
    _sum: { amount: true },
  })

  const totalFromCustomer =
    payments.find((p) => p.direction === PaymentDirection.CUSTOMER_TO_OWNER)?._sum.amount ?? 0

  const totalToWorker =
    payments.find((p) => p.direction === PaymentDirection.OWNER_TO_WORKER)?._sum.amount ?? 0

  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: { agreedPrice: true, paymentStatus: true },
  })

  return {
    totalFromCustomer,
    totalToWorker,
    agreedPrice: chore?.agreedPrice ?? null,
    paymentStatus: chore?.paymentStatus ?? ChorePaymentStatus.NONE,
  }
}

/**
 * Recompute and update the payment status for a chore
 */
async function recomputeChorePaymentStatus(choreId: string) {
  const summary = await getPaymentSummaryForChore(choreId)

  let newStatus: ChorePaymentStatus = ChorePaymentStatus.NONE

  if (!summary.agreedPrice || summary.agreedPrice <= 0) {
    // No agreed price → keep NONE for now
    newStatus = ChorePaymentStatus.NONE
  } else {
    if (summary.totalFromCustomer <= 0) {
      newStatus = ChorePaymentStatus.NONE
    } else if (summary.totalFromCustomer < summary.agreedPrice) {
      newStatus = ChorePaymentStatus.CUSTOMER_PARTIAL
    } else if (summary.totalFromCustomer >= summary.agreedPrice) {
      // We mark CUSTOMER_PAID; later we can move to SETTLED when worker payout is done
      newStatus = ChorePaymentStatus.CUSTOMER_PAID
    }
  }

  await prisma.chore.update({
    where: { id: choreId },
    data: { paymentStatus: newStatus },
  })
}

/**
 * Get both payments and summary for a chore (convenience helper)
 */
export async function getChorePaymentsAndSummary(choreId: string) {
  const [payments, summary] = await Promise.all([
    getPaymentsForChore(choreId),
    getPaymentSummaryForChore(choreId),
  ])
  return { payments, summary }
}

/**
 * Payment dashboard data for customer
 */
export interface CustomerPaymentDashboard {
  totalPaidAllTime: number
  totalPaidLast30Days: number
  unsettledCompletedChores: Array<{
    id: string
    title: string
    paymentStatus: ChorePaymentStatus
    agreedPrice: number | null
    assignedWorker: { id: string; name: string | null } | null
  }>
  recentPayments: Array<{
    id: string
    amount: number
    direction: PaymentDirection
    method: PaymentMethod
    notes: string | null
    createdAt: Date
    chore: { id: string; title: string }
    fromUser: { id: string; name: string | null }
    toUser: { id: string; name: string | null }
  }>
}

/**
 * Get payment dashboard data for a customer
 */
export async function getCustomerPaymentDashboard(
  customerId: string
): Promise<CustomerPaymentDashboard> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Total paid all time (from customer)
  const allPayments = await prisma.payment.findMany({
    where: {
      fromUserId: customerId,
      direction: {
        in: [PaymentDirection.CUSTOMER_TO_OWNER, PaymentDirection.OWNER_TO_WORKER],
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const totalPaidAllTime = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaidLast30Days = allPayments
    .filter((p) => p.createdAt >= thirtyDaysAgo)
    .reduce((sum, p) => sum + p.amount, 0)

  // Unsettled completed chores
  const unsettledCompletedChores = await prisma.chore.findMany({
    where: {
      createdById: customerId,
      status: ChoreStatus.COMPLETED,
      paymentStatus: {
        not: ChorePaymentStatus.SETTLED,
      },
    },
    select: {
      id: true,
      title: true,
      paymentStatus: true,
      agreedPrice: true,
      assignedWorker: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Recent payments (last 10)
  const recentPayments = await prisma.payment.findMany({
    where: {
      fromUserId: customerId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  return {
    totalPaidAllTime,
    totalPaidLast30Days,
    unsettledCompletedChores: unsettledCompletedChores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      paymentStatus: chore.paymentStatus,
      agreedPrice: chore.agreedPrice,
      assignedWorker: chore.assignedWorker,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      direction: p.direction,
      method: p.method,
      notes: p.notes,
      createdAt: p.createdAt,
      chore: p.chore,
      fromUser: p.fromUser,
      toUser: p.toUser,
    })),
  }
}

/**
 * Payment dashboard data for worker
 */
export interface WorkerPaymentDashboard {
  totalEarnedAllTime: number
  totalEarnedLast30Days: number
  unsettledCompletedChores: Array<{
    id: string
    title: string
    paymentStatus: ChorePaymentStatus
    agreedPrice: number | null
    createdBy: { id: string; name: string | null }
  }>
  recentPayments: Array<{
    id: string
    amount: number
    method: PaymentMethod
    notes: string | null
    createdAt: Date
    chore: { id: string; title: string }
    fromUser: { id: string; name: string | null }
    toUser: { id: string; name: string | null }
  }>
}

/**
 * Get payment dashboard data for a worker
 */
export async function getWorkerPaymentDashboard(
  workerId: string
): Promise<WorkerPaymentDashboard> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Total earned all time (to worker)
  const allPayments = await prisma.payment.findMany({
    where: {
      direction: PaymentDirection.OWNER_TO_WORKER,
      toUserId: workerId,
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const totalEarnedAllTime = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalEarnedLast30Days = allPayments
    .filter((p) => p.createdAt >= thirtyDaysAgo)
    .reduce((sum, p) => sum + p.amount, 0)

  // Unsettled completed chores
  const unsettledCompletedChores = await prisma.chore.findMany({
    where: {
      assignedWorkerId: workerId,
      status: ChoreStatus.COMPLETED,
      paymentStatus: {
        not: ChorePaymentStatus.SETTLED,
      },
    },
    select: {
      id: true,
      title: true,
      paymentStatus: true,
      agreedPrice: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Recent payments (last 10)
  const recentPayments = await prisma.payment.findMany({
    where: {
      direction: PaymentDirection.OWNER_TO_WORKER,
      toUserId: workerId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  return {
    totalEarnedAllTime,
    totalEarnedLast30Days,
    unsettledCompletedChores: unsettledCompletedChores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      paymentStatus: chore.paymentStatus,
      agreedPrice: chore.agreedPrice,
      createdBy: chore.createdBy,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      notes: p.notes,
      createdAt: p.createdAt,
      chore: p.chore,
      fromUser: p.fromUser,
      toUser: p.toUser,
    })),
  }
}

/**
 * Helper to get end of day for a date
 */
function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/**
 * Payment report filters
 */
export type PaymentReportFilters = {
  fromDate?: Date
  toDate?: Date
}

/**
 * Get payment report for a user (customer or worker)
 */
export async function getPaymentReportForUser(
  userId: string,
  role: UserRole,
  filters: PaymentReportFilters = {}
) {
  const where: any = {}

  // Role-based filtering
  if (role === UserRole.CUSTOMER) {
    // Customer: payments where fromUserId = userId (what customer paid)
    where.fromUserId = userId
  } else if (role === UserRole.WORKER) {
    // Worker: payments where toUserId = userId (what worker received)
    where.toUserId = userId
    where.direction = PaymentDirection.OWNER_TO_WORKER
  } else {
    // Admin or other roles - return empty for now
    return { payments: [] }
  }

  // Date range filtering
  if (filters.fromDate) {
    where.createdAt = {
      ...where.createdAt,
      gte: filters.fromDate,
    }
  }
  if (filters.toDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: endOfDay(filters.toDate),
    }
  }

  // Fetch payments with relations
  const payments = await prisma.payment.findMany({
    where,
    include: {
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Transform to report format
  return {
    payments: payments.map((p) => ({
      id: p.id,
      choreId: p.choreId,
      choreTitle: p.chore.title,
      direction: p.direction,
      method: p.method,
      amount: p.amount,
      createdAt: p.createdAt,
      notes: p.notes,
      fromUserName: p.fromUser.name || p.fromUser.email || 'Unknown',
      toUserName: p.toUser.name || p.toUser.email || 'Unknown',
    })),
  }
}

