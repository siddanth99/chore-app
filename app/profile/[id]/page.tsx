import { getRatingsForUser, getAverageRating } from '@/server/api/ratings'
import { prisma } from '@/server/db/client'
import { getCurrentUser } from '@/server/auth/role'
import ProfileClient from './profile-client'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      baseLocation: true,
      createdAt: true,
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white shadow p-6">
            <p className="text-gray-500">User not found</p>
          </div>
        </div>
      </div>
    )
  }

  // Get ratings
  const ratings = await getRatingsForUser(user.id)
  const averageRating = await getAverageRating(user.id)

  // Get completed chores
  const completedChores = await prisma.chore.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { createdById: user.id },
        { assignedWorkerId: user.id },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedWorker: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10, // Limit to recent 10
  })

  const currentUser = await getCurrentUser()

  return (
    <ProfileClient
      user={user}
      ratings={ratings}
      averageRating={averageRating}
      completedChores={completedChores}
      currentUserId={currentUser?.id}
    />
  )
}

