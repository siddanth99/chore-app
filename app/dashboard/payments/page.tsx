import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import PaymentsTable from './PaymentsTable'

export default async function PaymentsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch payments for the current user with chore details
  const payments = await prisma.razorpayPayment.findMany({
    where: { userId: user.id },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          budget: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payment History</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            View all your Razorpay payment transactions
          </p>
        </div>

        <PaymentsTable initialPayments={payments} />
      </div>
    </div>
  )
}

