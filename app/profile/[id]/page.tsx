import { getRatingsForUser, getAverageRating } from '@/server/api/ratings'
import { prisma } from '@/server/db/client'
import { getCurrentUser } from '@/server/auth/role'
import ProfilePublicView from '@/components/profile/ProfilePublicView'

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
            <p className="text-slate-500 dark:text-slate-400">User not found</p>
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

  // Transform ratings to match expected format
  const formattedRatings = ratings.map((rating) => ({
    id: rating.id,
    score: rating.score,
    comment: rating.comment,
    createdAt: rating.createdAt,
    fromUser: {
      id: rating.fromUser.id,
      name: rating.fromUser.name,
    },
    chore: {
      id: rating.chore.id,
      title: rating.chore.title,
    },
  }))

  return (
    <ProfilePublicView
      user={user}
      ratings={formattedRatings}
      averageRating={averageRating}
    />
  )
}

