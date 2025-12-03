import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface ProfileCardProps {
  id: string
  name: string
  email: string
  role: string
  bio: string | null
  avatarUrl: string | null
  baseLocation: string | null
  createdAt: Date | string
  phone?: string | null
  skills?: string[]
  hourlyRate?: number | null
}

export default function ProfileCard({
  id,
  name,
  email,
  role,
  bio,
  avatarUrl,
  baseLocation,
  createdAt,
  phone,
  skills,
  hourlyRate,
}: ProfileCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Deterministic date formatting to avoid SSR/CSR hydration mismatch
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Card className="mb-6">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-2xl font-bold text-[#4F46E5] border-2 border-slate-200 dark:border-slate-700">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {email}
              </p>
            </div>
            <Badge variant="neutral">{role}</Badge>
          </div>

          {bio && (
            <p className="text-slate-700 dark:text-slate-300 mb-3">{bio}</p>
          )}

          <div className="space-y-1 text-sm">
            {phone && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-medium">Phone:</span> {phone}
              </p>
            )}
            {baseLocation && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-medium">Location:</span> {baseLocation}
              </p>
            )}
            {hourlyRate && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-medium">Hourly Rate:</span> ₹{hourlyRate}
                /hr
              </p>
            )}
            {skills && skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Member since {formattedDate}
          </p>

          <Link
            href={`/profile/${id}`}
            className="inline-block mt-3 text-sm text-[#4F46E5] hover:text-[#4F46E5]/80 dark:text-[#4F46E5] dark:hover:text-[#4F46E5]/80 transition-colors"
          >
            View public profile →
          </Link>
        </div>
      </div>
    </Card>
  )
}

