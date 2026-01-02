import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import WorkerPayoutSettingsPage from '@/components/payments/pages/WorkerPayoutSettingsPage'

export default async function WorkerPayoutSettingsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  // Ensure user is a worker
  if (user.role !== 'WORKER') {
    redirect('/dashboard')
  }

  return <WorkerPayoutSettingsPage />
}

