import { redirect } from 'next/navigation'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'
import { listApplicationsForWorker } from '@/server/api/applications'
import ApplicationsList from './applications-list'

export default async function ApplicationsPage() {
  try {
    const user = await requireRole(UserRole.WORKER)
    const applications = await listApplicationsForWorker(user.id)

    return <ApplicationsList applications={applications} />
  } catch (error) {
    redirect('/signin')
  }
}

