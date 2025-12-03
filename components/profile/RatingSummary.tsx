import Card from '@/components/ui/Card'

interface RatingSummaryProps {
  average: number
  count: number
}

export default function RatingSummary({ average, count }: RatingSummaryProps) {
  if (count === 0) {
    return null
  }

  const fullStars = Math.floor(average)
  const hasHalfStar = average % 1 >= 0.5

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
        Rating Summary
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {average.toFixed(1)}
          </span>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => {
              if (star <= fullStars) {
                return (
                  <span key={star} className="text-2xl text-yellow-400">
                    ★
                  </span>
                )
              } else if (star === fullStars + 1 && hasHalfStar) {
                return (
                  <span key={star} className="text-2xl text-yellow-400">
                    ★
                  </span>
                )
              } else {
                return (
                  <span
                    key={star}
                    className="text-2xl text-slate-400 dark:text-slate-600"
                  >
                    ★
                  </span>
                )
              }
            })}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Based on {count} {count === 1 ? 'review' : 'reviews'}
        </p>
      </div>
    </Card>
  )
}

