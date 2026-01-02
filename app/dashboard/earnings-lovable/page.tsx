import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import WorkerEarningsPage from '@/components/payments/pages/WorkerEarningsPage'
import { getWorkerEarningsDashboard } from '@/server/api/payments-dashboard'

export default async function WorkerEarningsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Ensure user is a worker
  if (user.role !== 'WORKER') {
    redirect('/dashboard')
  }

  const data = await getWorkerEarningsDashboard(user.id)

  return <WorkerEarningsPage summary={data.summary} payouts={data.payouts} chartData={data.chartData} />
}

