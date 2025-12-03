import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db/client'
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
      createdAt: true,
      // TODO: Add phone, skills, hourlyRate fields to User model in Prisma schema
      // For now, these will be undefined/null
    },
  })

  if (!user) {
    redirect('/api/auth/signin?callbackUrl=/profile')
  }

  // Get ratings
  const ratings = await getRatingsForUser(user.id)
  const averageRating = await getAverageRating(user.id)

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
    <ProfilePageView
      profile={{
        ...user,
        phone: undefined, // TODO: Add phone field to User model
        skills: undefined, // TODO: Add skills field to User model (array or JSON)
        hourlyRate: undefined, // TODO: Add hourlyRate field to User model
      }}
      ratings={formattedRatings}
      averageRating={averageRating}
    />
  )
}
