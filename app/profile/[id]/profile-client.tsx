'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface ProfileClientProps {
  user: any
  ratings: any[]
  averageRating: { average: number; count: number }
  completedChores: any[]
  currentUserId?: string
}

export default function ProfileClient({
  user,
  ratings,
  averageRating,
  completedChores,
  currentUserId,
}: ProfileClientProps) {
  const renderStars = (score: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= score ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">({score}/5)</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* User Info Card */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{user.name}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{user.email}</p>
            </div>
            <Badge variant="neutral">
              {user.role}
            </Badge>
          </div>

            {user.bio && (
              <p className="text-gray-700 dark:text-slate-300 mb-4">{user.bio}</p>
            )}

            {user.baseLocation && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                <span className="font-medium">Location:</span> {user.baseLocation}
              </p>
            )}

          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </Card>

        {/* Rating Summary - Only show if there are ratings */}
        {averageRating.count > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-4">Rating Summary</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900 dark:text-slate-50">
                    {averageRating.average.toFixed(1)}
                  </span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= Math.round(averageRating.average)
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-slate-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Based on {averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </Card>
        )}

        {/* Reviews */}
        {ratings.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-4">
              Reviews ({ratings.length})
            </h2>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-50">{rating.fromUser.name}</p>
                        <Link
                          href={`/chores/${rating.chore.id}`}
                          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          {rating.chore.title}
                        </Link>
                      </div>
                      {renderStars(rating.score)}
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{rating.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
        )}

        {/* Completed Chores */}
        {completedChores.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-4">
              Recent Completed Chores ({completedChores.length})
            </h2>
              <div className="space-y-3">
                {completedChores.map((chore) => (
                  <div
                    key={chore.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow transition-transform hover:-translate-y-0.5"
                  >
                    <Link
                      href={`/chores/${chore.id}`}
                      className="text-lg font-medium text-gray-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {chore.title}
                    </Link>
                    <div className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                      {user.role === 'CUSTOMER' ? (
                        <span>
                          Worker: <span className="font-medium">{chore.assignedWorker?.name}</span>
                        </span>
                      ) : (
                        <span>
                          Customer: <span className="font-medium">{chore.createdBy.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Completed on {new Date(chore.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
        )}

        {/* Empty states */}
        {ratings.length === 0 && averageRating.count === 0 && (
          <Card className="mb-6 text-center">
            <div className="py-8">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">No ratings yet</h3>
              <p className="text-gray-500 dark:text-slate-400">This user hasn't received any ratings yet.</p>
            </div>
          </Card>
        )}

        {completedChores.length === 0 && (
          <Card className="text-center">
            <div className="py-8">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">No completed chores</h3>
              <p className="text-gray-500 dark:text-slate-400">
                {user.role === 'WORKER'
                  ? 'This worker hasn\'t completed any chores yet.'
                  : 'This customer hasn\'t completed any chores yet.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

