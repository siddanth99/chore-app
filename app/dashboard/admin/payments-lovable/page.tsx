import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import AdminPaymentsPage from '@/components/payments/pages/AdminPaymentsPage'
import { getAdminPaymentsDashboard } from '@/server/api/payments-dashboard'

export default async function AdminPaymentsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Ensure user is an admin
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const data = await getAdminPaymentsDashboard()

  return <AdminPaymentsPage summary={data.summary} payments={data.payments} />
}

