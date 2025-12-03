import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import RatingSummary from './RatingSummary'
import ReviewsList from './ReviewsList'
import { formatDate } from '@/lib/utils'

interface ProfilePublicViewProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    bio: string | null
    avatarUrl: string | null
    baseLocation: string | null
    createdAt: Date | string
  }
  ratings: Array<{
    id: string
    score: number
    comment: string | null
    createdAt: Date | string
    fromUser: {
      id: string
      name: string
    }
    chore: {
      id: string
      title: string
    }
  }>
  averageRating: {
    average: number
    count: number
  }
}

export default function ProfilePublicView({
  user,
  ratings,
  averageRating,
}: ProfilePublicViewProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* User Info Card */}
        <Card className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-2xl font-bold text-[#4F46E5] border-2 border-slate-200 dark:border-slate-700">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {user.name}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {user.email}
                  </p>
                </div>
                <Badge variant="neutral">{user.role}</Badge>
              </div>

              {user.bio && (
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  {user.bio}
                </p>
              )}

              {user.baseLocation && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span className="font-medium">Location:</span> {user.baseLocation}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Rating Summary */}
        <RatingSummary
          average={averageRating.average}
          count={averageRating.count}
        />

        {/* Reviews List */}
        <ReviewsList reviews={ratings} />

        {/* Empty states */}
        {ratings.length === 0 && averageRating.count === 0 && (
          <Card className="mb-6 text-center">
            <div className="py-8">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                No ratings yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                This user hasn't received any ratings yet.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

