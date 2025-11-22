'use client'

import Link from 'next/link'

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
              star <= score ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({score}/5)</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* User Info Card */}
        <div className="rounded-lg bg-white shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {user.role}
              </span>
            </div>

            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}

            {user.baseLocation && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">Location:</span> {user.baseLocation}
              </p>
            )}

            <p className="text-sm text-gray-500 mt-2">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Rating Summary */}
        <div className="rounded-lg bg-white shadow mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rating Summary</h2>
            {averageRating.count > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {averageRating.average.toFixed(1)}
                  </span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= Math.round(averageRating.average)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Based on {averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No ratings yet</p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {ratings.length > 0 && (
          <div className="rounded-lg bg-white shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reviews ({ratings.length})
              </h2>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{rating.fromUser.name}</p>
                        <Link
                          href={`/chores/${rating.chore.id}`}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          {rating.chore.title}
                        </Link>
                      </div>
                      {renderStars(rating.score)}
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 mt-2">{rating.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Chores */}
        {completedChores.length > 0 && (
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Completed Chores ({completedChores.length})
              </h2>
              <div className="space-y-3">
                {completedChores.map((chore) => (
                  <div
                    key={chore.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <Link
                      href={`/chores/${chore.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {chore.title}
                    </Link>
                    <div className="mt-2 text-sm text-gray-600">
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
                    <p className="text-xs text-gray-500 mt-1">
                      Completed on {new Date(chore.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

