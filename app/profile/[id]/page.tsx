import { getRatingsForUser, getAverageRating } from '@/server/api/ratings'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'
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
      role: true,
      bio: true,
      avatarUrl: true,
      baseLocation: true,
      skills: true,
      hourlyRate: true,
      createdAt: true,
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl bg-card border border-border shadow p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">User not found</h1>
            <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    )
  }

  // Get ratings
  const ratings = await getRatingsForUser(user.id)
  const averageRating = await getAverageRating(user.id)

  // Get stats based on role
  let stats = {
    completedChores: 0,
    totalPosted: 0,
  }

  if (user.role === 'WORKER') {
    const completedCount = await prisma.chore.count({
      where: {
        assignedWorkerId: user.id,
        status: ChoreStatus.COMPLETED,
      },
    })
    stats.completedChores = completedCount
  } else {
    const [posted, completed] = await Promise.all([
      prisma.chore.count({
        where: { createdById: user.id },
      }),
      prisma.chore.count({
        where: {
          createdById: user.id,
          status: ChoreStatus.COMPLETED,
        },
      }),
    ])
    stats.totalPosted = posted
    stats.completedChores = completed
  }

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

  // Parse skills
  const parsedSkills = Array.isArray(user.skills) 
    ? (user.skills as string[]) 
    : []

  return (
    <ProfilePublicView
      user={{
        ...user,
        skills: parsedSkills,
        hourlyRate: user.hourlyRate ?? undefined,
      }}
      ratings={formattedRatings}
      averageRating={averageRating}
      stats={stats}
    />
  )
}

