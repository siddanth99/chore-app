import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import CustomerPaymentsPage from '@/components/payments/pages/CustomerPaymentsPage'
import { getCustomerPaymentsDashboard } from '@/server/api/payments-dashboard'

export default async function CustomerPaymentsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  const data = await getCustomerPaymentsDashboard(user.id)

  return <CustomerPaymentsPage summary={data.summary} payments={data.payments} />
}

