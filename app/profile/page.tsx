import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'
import { getRatingsForUser, getAverageRating } from '@/server/api/ratings'
import ProfilePageView from '@/components/profile/ProfilePageView'

export const revalidate = 60

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/profile')
  }

  const userId = session.user?.id

  if (!userId) {
    redirect('/api/auth/signin?callbackUrl=/profile')
  }

  // Fetch user profile data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      baseLocation: true,
      phone: true,
      skills: true,
      hourlyRate: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/api/auth/signin?callbackUrl=/profile')
  }

  // Get ratings
  const ratings = await getRatingsForUser(user.id)
  const averageRating = await getAverageRating(user.id)

  // Get stats based on role
  let stats = {
    completedChores: 0,
    totalPosted: 0,
    totalEarnings: 0,
    totalSpent: 0,
  }

  if (user.role === 'WORKER') {
    // Worker stats: completed chores as worker
    const completedAsWorker = await prisma.chore.findMany({
      where: {
        assignedWorkerId: userId,
        status: ChoreStatus.COMPLETED,
      },
      select: {
        budget: true,
        applications: {
          where: {
            workerId: userId,
            status: 'ACCEPTED',
          },
          select: {
            bidAmount: true,
          },
        },
      },
    })
    
    stats.completedChores = completedAsWorker.length
    stats.totalEarnings = completedAsWorker.reduce((sum, chore) => {
      const acceptedBid = chore.applications[0]?.bidAmount
      return sum + (acceptedBid ?? chore.budget ?? 0)
    }, 0)
  } else {
    // Customer stats: posted and completed chores
    const [posted, completed] = await Promise.all([
      prisma.chore.count({
        where: { createdById: userId },
      }),
      prisma.chore.findMany({
        where: {
          createdById: userId,
          status: ChoreStatus.COMPLETED,
        },
        select: {
          budget: true,
          applications: {
            where: { status: 'ACCEPTED' },
            select: { bidAmount: true },
          },
        },
      }),
    ])
    
    stats.totalPosted = posted
    stats.completedChores = completed.length
    stats.totalSpent = completed.reduce((sum, chore) => {
      const acceptedBid = chore.applications[0]?.bidAmount
      return sum + (acceptedBid ?? chore.budget ?? 0)
    }, 0)
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

  // Parse skills from JSON (stored as Json type in Prisma)
  const parsedSkills = Array.isArray(user.skills) 
    ? (user.skills as string[]) 
    : []

  return (
    <ProfilePageView
      profile={{
        ...user,
        phone: user.phone ?? undefined,
        skills: parsedSkills,
        hourlyRate: user.hourlyRate ?? undefined,
      }}
      ratings={formattedRatings}
      averageRating={averageRating}
      stats={stats}
    />
  )
}
