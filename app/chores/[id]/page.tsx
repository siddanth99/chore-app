import { redirect } from 'next/navigation'
import { getChoreById } from '@/server/api/chores'
import { getCurrentUser } from '@/server/auth/role'
import { listApplicationsForChore } from '@/server/api/applications'
import { prisma } from '@/server/db/client'
import ChoreDetailClient from './chore-detail-client'

export default async function ChoreDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  const chore = await getChoreById(params.id)

  if (!chore) {
    redirect('/chores')
  }

  // Get applications if user is the customer who created the chore
  let applications = null
  if (user && user.role === 'CUSTOMER' && chore.createdById === user.id) {
    try {
      applications = await listApplicationsForChore(chore.id, user.id)
    } catch (error) {
      // If there's an error, just continue without applications
      applications = []
    }
  }

  // Check if user has already rated this chore
  let hasRated = false
  if (user && chore.status === 'COMPLETED') {
    const existingRating = await prisma.rating.findUnique({
      where: {
        choreId_fromUserId: {
          choreId: chore.id,
          fromUserId: user.id,
        },
      },
    })
    hasRated = !!existingRating
  }

  return (
    <ChoreDetailClient
      chore={chore}
      currentUser={user}
      initialApplications={applications}
      hasRated={hasRated}
    />
  )
}

