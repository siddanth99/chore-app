import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import { listApplicationsForWorker } from '@/server/api/applications'
import ApplicationsList from './applications-list'

export default async function ApplicationsPage() {
  // Role is UI-only - any authenticated user can view their applications
  const user = await getCurrentUser()
  if (!user) {
    redirect('/signin')
  }
  
  const applications = await listApplicationsForWorker(user.id)

  return <ApplicationsList applications={applications} />
}

