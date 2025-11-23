import { getChoreById } from '@/server/api/chores'
import { getCurrentUser } from '@/server/auth/role'
import { listApplicationsForChore } from '@/server/api/applications'
import { getAverageRating } from '@/server/api/ratings'
import ChoreDetailClient from './chore-detail-client'

export default async function ChoreDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  // ✅ Unwrap the params Promise (Next.js 15 behavior)
  const { id } = await props.params

  const user = await getCurrentUser()
  const chore = await getChoreById(id)

  // If the chore is not found, show a debug message
  if (!chore) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            No chore found
          </h1>
          <p className="text-slate-700 dark:text-slate-300 mb-2">
            We couldn&apos;t find a chore with this ID:
          </p>
          <code className="rounded bg-gray-100 dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200">
            {id}
          </code>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            If you expected something here, double-check the ID and make sure the
            chore exists in the database.
          </p>
        </div>
      </div>
    )
  }

  // Load applications if user is the owner (customer who created the chore)
  let applications = null
  if (
    user &&
    user.role === 'CUSTOMER' &&
    chore.createdById === user.id
  ) {
    try {
      applications = await listApplicationsForChore(chore.id, user.id)
      // Fetch ratings for each worker in applications
      if (applications) {
        applications = await Promise.all(
          applications.map(async (app) => {
            const rating = await getAverageRating(app.workerId)
            return {
              ...app,
              workerRating: rating,
            }
          })
        )
      }
    } catch (error) {
      // If user is not authorized or error occurs, applications will be null
      console.error('Error loading applications:', error)
    }
  }

  // Fetch rating for assigned worker if exists
  let assignedWorkerRating = null
  if (chore.assignedWorkerId) {
    try {
      assignedWorkerRating = await getAverageRating(chore.assignedWorkerId)
    } catch (error) {
      console.error('Error loading assigned worker rating:', error)
    }
  }

  // If chore exists, show the real client page
  return (
    <ChoreDetailClient
      chore={chore}
      currentUser={user}
      initialApplications={applications}
      assignedWorkerRating={assignedWorkerRating}
    />
  )
}