import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/role'
import {
  getWorkerDashboardData,
  getCustomerDashboardData,
} from '@/server/api/dashboard'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  let dashboardData
  if (user.role === 'WORKER') {
    dashboardData = await getWorkerDashboardData(user.id)
  } else if (user.role === 'CUSTOMER') {
    dashboardData = await getCustomerDashboardData(user.id)
  } else {
    // Admin or other roles - show basic dashboard
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white shadow px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-50">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-50">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-50">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardClient
      user={user}
      role={user.role}
      data={dashboardData}
    />
  )
}

