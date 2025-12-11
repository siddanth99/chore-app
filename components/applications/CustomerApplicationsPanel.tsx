'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface Application {
  id: string
  status: ApplicationStatus
  bidAmount: number | null
  message: string | null
  createdAt: string | Date
  workerId: string
  worker: {
    id: string
    name: string | null
    email: string | null
  }
  workerAverageRating?: number
  workerRatingCount?: number
}

interface CustomerApplicationsPanelProps {
  applications: Application[]
  choreId: string
  choreStatus: string
  onAssign?: (applicationId: string) => Promise<void>
  onReject?: (applicationId: string) => Promise<void>
}

// Status configuration
const statusConfig = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  REJECTED: {
    label: 'Not Selected',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    ),
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </svg>
    ),
  },
}

// Star rating component
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              'w-3.5 h-3.5',
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
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  )
}

// Single application card
function ApplicationCard({
  application,
  choreStatus,
  onAssign,
  onReject,
  isAssigning,
  isRejecting,
}: {
  application: Application
  choreStatus: string
  onAssign: () => void
  onReject: () => void
  isAssigning: boolean
  isRejecting: boolean
}) {
  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.PENDING
  const canTakeAction = application.status === 'PENDING' && choreStatus === 'PUBLISHED'
  const isAccepted = application.status === 'ACCEPTED'

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all',
        isAccepted
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-500/20'
          : 'bg-card border-border hover:border-border/80 hover:shadow-sm'
      )}
    >
      {/* Accepted badge */}
      {isAccepted && (
        <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
          ✓ Selected Worker
        </div>
      )}

      {/* Header: Worker info + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {application.worker.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <Link
              href={`/profile/${application.worker.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {application.worker.name || 'Anonymous'}
            </Link>
            {(application.workerAverageRating !== undefined && application.workerRatingCount !== undefined) && (
              <div className="mt-0.5">
                <StarRating rating={application.workerAverageRating} count={application.workerRatingCount} />
              </div>
            )}
          </div>
        </div>
        
        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
          status.className
        )}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Bid amount */}
      {application.bidAmount && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-secondary/50">
          <span className="text-primary text-base leading-none">₹</span>
          <span className="text-sm font-semibold text-foreground">
            Bid: ₹{application.bidAmount.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Message */}
      {application.message && (
        <div className="mb-3">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{application.message}&rdquo;
          </p>
        </div>
      )}

      {/* Footer: Date + Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Applied {formatDate(application.createdAt)}
        </span>

        {/* Action buttons */}
        {canTakeAction && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReject}
              disabled={isRejecting || isAssigning}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isRejecting ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Decline'
              )}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAssign}
              disabled={isAssigning || isRejecting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isAssigning ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Accepting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Accept
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Empty state
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Workers will start applying once they see your chore. Share it or check back soon!
      </p>
    </div>
  )
}

// Main component
export default function CustomerApplicationsPanel({
  applications,
  choreId,
  choreStatus,
}: CustomerApplicationsPanelProps) {
  const router = useRouter()
  const toast = useToast()
  const [localApplications, setLocalApplications] = useState(applications)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sort applications: ACCEPTED first, then PENDING, then REJECTED
  const sortedApplications = [...localApplications].sort((a, b) => {
    const order = { ACCEPTED: 0, PENDING: 1, REJECTED: 2, WITHDRAWN: 3 }
    return (order[a.status] ?? 4) - (order[b.status] ?? 4)
  })

  const pendingCount = localApplications.filter((a) => a.status === 'PENDING').length
  const acceptedApp = localApplications.find((a) => a.status === 'ACCEPTED')

  const handleAssign = async (applicationId: string) => {
    if (!confirm('Are you sure you want to accept this worker? Other pending applications will be automatically declined.')) {
      return
    }

    setAssigningId(applicationId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/applications/${applicationId}/assign`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Too many requests', 'Please try again later.')
          setError('You are making too many requests. Please try again later.')
        } else {
          toast.error('Failed to accept', data.error || 'Could not accept the application.')
          setError(data.error || 'Failed to accept application')
        }
        return
      }

      // Update local state
      setLocalApplications((prev) =>
        prev.map((app) => ({
          ...app,
          status: app.id === applicationId ? 'ACCEPTED' : app.status === 'PENDING' ? 'REJECTED' : app.status,
        })) as Application[]
      )
      
      toast.success('Worker assigned! 🎉', 'They have been notified and other applicants have been declined.')
      setSuccess('Worker accepted! They have been notified.')
      router.refresh()
    } catch (err) {
      toast.error('Something went wrong', 'Please try again.')
      setError('An error occurred. Please try again.')
    } finally {
      setAssigningId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    setRejectingId(applicationId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Too many requests', 'Please try again later.')
          setError('You are making too many requests. Please try again later.')
        } else {
          toast.error('Failed to decline', data.error || 'Could not decline the application.')
          setError(data.error || 'Failed to decline application')
        }
        return
      }

      // Update local state
      setLocalApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: 'REJECTED' as ApplicationStatus } : app
        )
      )
      
      toast.info('Application declined', 'The worker has been notified.')
      setSuccess('Application declined.')
      router.refresh()
    } catch (err) {
      toast.error('Something went wrong', 'Please try again.')
      setError('An error occurred. Please try again.')
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <Card className="mb-6" id="applications">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Applications</h2>
            <p className="text-sm text-muted-foreground">
              {localApplications.length === 0
                ? 'No applications yet'
                : `${localApplications.length} total • ${pendingCount} pending`}
            </p>
          </div>
        </div>
        
        {acceptedApp && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Worker Selected
          </span>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {/* Applications list or empty state */}
      {localApplications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {sortedApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              choreStatus={choreStatus}
              onAssign={() => handleAssign(app.id)}
              onReject={() => handleReject(app.id)}
              isAssigning={assigningId === app.id}
              isRejecting={rejectingId === app.id}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

