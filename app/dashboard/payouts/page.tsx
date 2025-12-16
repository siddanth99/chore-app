import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import WorkerPayoutTable from './WorkerPayoutTable'

export default async function WorkerPayoutsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Ensure user is a worker
  if (user.role !== 'WORKER') {
    redirect('/dashboard')
  }

  // Fetch full user data to get razorpayAccountId, upiId, etc.
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      upiId: true,
      razorpayAccountId: true,
    },
  })

  if (!fullUser) {
    redirect('/signin')
  }

  // Fetch all RazorpayPayment records where the worker was assigned to the chore
  const allPayments = await prisma.razorpayPayment.findMany({
    where: {
      chore: {
        assignedWorkerId: user.id,
      },
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          budget: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Filter to only include payments with worker payouts (split payments)
  // Type assertion needed until Prisma client is regenerated after migration
  const payments = allPayments.filter((p) => {
    const payment = p as any
    return payment.workerPayout != null
  }) as any[]

  // Compute summary stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  let totalEarnings = 0
  let monthEarnings = 0

  payments.forEach((payment: any) => {
    // Only count SUCCESS payments as earnings
    if (payment.status === 'SUCCESS' && payment.workerPayout) {
      const earnings = payment.workerPayout / 100 // Convert paise to rupees
      totalEarnings += earnings

      // Check if payment was created this month (based on createdAt)
      const paymentDate = new Date(payment.createdAt)
      if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
        monthEarnings += earnings
      }
    }
  })

  const summary = {
    totalEarnings,
    monthEarnings,
    upiId: fullUser.upiId || 'Not set',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payout Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            View your earnings and payout history
          </p>
        </div>

        <WorkerPayoutTable payments={payments} summary={summary} />
      </div>
    </div>
  )
}

