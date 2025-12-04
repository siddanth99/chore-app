import Link from 'next/link'
import Card from '@/components/ui/Card'
import { formatDate, cn } from '@/lib/utils'

interface ProfilePublicViewProps {
  user: {
    id: string
    name: string
    role: string
    bio: string | null
    avatarUrl: string | null
    baseLocation: string | null
    createdAt: Date | string
    skills?: string[]
    hourlyRate?: number | null
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
  stats?: {
    completedChores: number
    totalPosted: number
  }
}

// Star rating component
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            sizeClasses[size],
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 dark:text-slate-600'
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// Trust badge component
function TrustBadge({ 
  icon, 
  label, 
  value,
  variant = 'default'
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  variant?: 'default' | 'success' | 'warning'
}) {
  const variants = {
    default: 'bg-secondary/50 text-foreground',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
  
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', variants[variant])}>
      <span className="w-5 h-5">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-xs opacity-70">{label}</p>
      </div>
    </div>
  )
}

export default function ProfilePublicView({
  user,
  ratings,
  averageRating,
  stats,
}: ProfilePublicViewProps) {
  const isWorker = user.role === 'WORKER'
  
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(user.createdAt)
  const memberYear = memberSince.getFullYear()
  const memberMonth = memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-8 pb-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          {/* Profile Hero Card */}
          <Card className="relative overflow-hidden">
            {/* Gradient accent */}
            <div className={cn(
              'absolute top-0 left-0 right-0 h-24',
              isWorker 
                ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20'
                : 'bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20'
            )} />
            
            <div className="relative pt-16 pb-6 px-6">
              {/* Avatar and Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-20 sm:-mt-16 mb-6">
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-background shadow-xl"
                    />
                  ) : (
                    <div className={cn(
                      'w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-background shadow-xl',
                      isWorker ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-primary to-accent'
                    )}>
                      {initials}
                    </div>
                  )}
                  {/* Role badge */}
                  <span className={cn(
                    'absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                    isWorker 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-primary text-white'
                  )}>
                    {isWorker ? '🛠 Worker' : '👤 Customer'}
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  {user.baseLocation && (
                    <p className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {user.baseLocation}
                    </p>
                  )}
                  {/* Rating for workers */}
                  {isWorker && averageRating.count > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                      <StarRating rating={averageRating.average} />
                      <span className="text-sm text-muted-foreground">
                        {averageRating.average.toFixed(1)} ({averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                {isWorker ? (
                  <>
                    {stats && stats.completedChores > 0 && (
                      <TrustBadge
                        icon={<svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        label="Jobs Completed"
                        value={stats.completedChores}
                        variant="success"
                      />
                    )}
                    {averageRating.count > 0 && (
                      <TrustBadge
                        icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                        label={`${averageRating.count} reviews`}
                        value={averageRating.average.toFixed(1)}
                        variant="warning"
                      />
                    )}
                    {user.hourlyRate && (
                      <TrustBadge
                        icon={<svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        label="Hourly Rate"
                        value={`$${user.hourlyRate}`}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {stats && stats.totalPosted > 0 && (
                      <TrustBadge
                        icon={<svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                        label="Chores Posted"
                        value={stats.totalPosted}
                      />
                    )}
                    {stats && stats.completedChores > 0 && (
                      <TrustBadge
                        icon={<svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        label="Completed"
                        value={stats.completedChores}
                        variant="success"
                      />
                    )}
                  </>
                )}
                <TrustBadge
                  icon={<svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
                  label="Member Since"
                  value={memberMonth}
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {/* About Section */}
        {user.bio && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <h2 className="text-lg font-semibold text-foreground">About</h2>
            </div>
            <p className="text-muted-foreground">{user.bio}</p>
          </Card>
        )}

        {/* Skills & Services (Workers only) */}
        {isWorker && user.skills && user.skills.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
              <h2 className="text-lg font-semibold text-foreground">Skills & Services</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground font-medium"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Reviews Section */}
        {ratings.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <h2 className="text-lg font-semibold text-foreground">Reviews ({ratings.length})</h2>
              </div>
              {averageRating.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={averageRating.average} size="sm" />
                  <span className="text-sm font-medium text-foreground">{averageRating.average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {ratings.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link 
                        href={`/profile/${review.fromUser.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {review.fromUser.name}
                      </Link>
                      <Link
                        href={`/chores/${review.chore.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {review.chore.title}
                      </Link>
                    </div>
                    <StarRating rating={review.score} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">&ldquo;{review.comment}&rdquo;</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {ratings.length === 0 && !user.bio && (!user.skills || user.skills.length === 0) && (
          <Card className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{user.name}</h3>
            <p className="text-sm text-muted-foreground">
              {isWorker 
                ? 'This worker hasn\'t added profile details yet.'
                : 'This customer hasn\'t added profile details yet.'}
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
