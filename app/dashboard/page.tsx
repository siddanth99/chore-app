import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import {
  listChoresForCustomer,
  listAssignedChoresForWorker,
  listNearbyOfflineChores,
} from '@/server/api/chores'
import { listApplicationsForWorkerDashboard } from '@/server/api/applications'
import LogoutButton from './logout-button'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === 'CUSTOMER') {
    const chores = await listChoresForCustomer(user.id)
    return <DashboardClient user={user} chores={chores} />
  } else if (user.role === 'WORKER') {
    const assignedChores = await listAssignedChoresForWorker(user.id)
    const applications = await listApplicationsForWorkerDashboard(user.id)
    const nearbyChores = await listNearbyOfflineChores(user.id)
    
    // Get fallback offline chores if no baseLocation
    let fallbackOfflineChores: any[] = []
    if (!user.baseLocation || nearbyChores.length === 0) {
      const { listPublishedChoresWithFilters } = await import('@/server/api/chores')
      fallbackOfflineChores = await listPublishedChoresWithFilters({ type: 'OFFLINE' })
    }
    
    return (
      <DashboardClient
        user={user}
        assignedChores={assignedChores}
        applications={applications}
        nearbyChores={nearbyChores}
        fallbackOfflineChores={fallbackOfflineChores}
      />
    )
  }

  // Admin or other roles - show basic dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg bg-white shadow px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <LogoutButton />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-lg font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-lg font-medium text-gray-900">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

