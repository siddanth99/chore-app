import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import AdminPayoutsPage from '@/components/payments/pages/AdminPayoutsPage'
import { getAdminPayoutsDashboard } from '@/server/api/payments-dashboard'

export default async function AdminPayoutsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Ensure user is an admin
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const data = await getAdminPayoutsDashboard()

  return <AdminPayoutsPage summary={data.summary} payouts={data.payouts} />
}

