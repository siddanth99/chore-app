import Card from '@/components/ui/Card'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Review {
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
}

interface ReviewsListProps {
  reviews: Review[]
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return null
  }

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= score
                ? 'text-yellow-400'
                : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
          ({score}/5)
        </span>
      </div>
    )
  }

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
        Reviews ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {review.fromUser.name}
                </p>
                <Link
                  href={`/chores/${review.chore.id}`}
                  className="text-sm text-[#4F46E5] hover:text-[#4F46E5]/80 dark:text-[#4F46E5] dark:hover:text-[#4F46E5]/80 transition-colors"
                >
                  {review.chore.title}
                </Link>
              </div>
              {renderStars(review.score)}
            </div>
            {review.comment && (
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                {review.comment}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {formatDate(review.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

