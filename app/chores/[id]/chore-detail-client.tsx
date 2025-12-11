'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, ChoreType } from '@prisma/client'
import ChoreChat from '@/features/chat/chore-chat'
import MapPreview from '@/components/MapPreview'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import CustomerApplicationsPanel from '@/components/applications/CustomerApplicationsPanel'
import { useToast } from '@/components/ui/toast'

interface ChoreDetailClientProps {
  chore: any
  currentUser: any
  initialApplications: any[] | null
  hasRated?: boolean
  assignedWorkerRating?: { average: number; count: number } | null
  latestCancellationRequest?: any | null
}

export default function ChoreDetailClient({
  chore,
  currentUser,
  initialApplications,
  hasRated: initialHasRated = false,
  assignedWorkerRating = null,
  latestCancellationRequest: initialLatestCancellationRequest = null,
}: ChoreDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [applications, setApplications] = useState(initialApplications || [])
  
  // Determine back navigation based on where user came from
  const from = searchParams.get('from')
  const view = searchParams?.get('view') || (typeof window !== 'undefined' ? localStorage.getItem('choreflow_view_v1') : 'list')
  const backHref = from === 'notifications' 
    ? '/notifications' 
    : from === 'dashboard' 
    ? '/dashboard'
    : from === 'applications'
    ? '/applications'
    : `/chores?view=${view}`
  const backLabel = from === 'notifications'
    ? '← Back to Notifications'
    : from === 'dashboard'
    ? '← Back to Dashboard'
    : from === 'applications'
    ? '← Back to My Applications'
    : '← Back to Chores'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [latestCancellationRequest, setLatestCancellationRequest] = useState(
    initialLatestCancellationRequest
  )
  const [choreStatus, setChoreStatus] = useState<string>(chore.status)

  // Application form state (for workers)
  const [bidAmount, setBidAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Rating form state
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [hasRated, setHasRated] = useState(initialHasRated)
  const [myRating, setMyRating] = useState<any>(null)
  const [choreRating, setChoreRating] = useState<any>(null)
  const [loadingRatings, setLoadingRatings] = useState(false)

  // Determine ownership-based behavior (ignore global role toggle for this page)
  // Owner = can manage applications (customer view)
  // Non-owner = can apply/withdraw (worker view)
  const isOwner = currentUser && chore.createdById === currentUser.id
  const isNotOwner = currentUser && chore.createdById !== currentUser.id
  const isAssignedWorker = currentUser && chore.assignedWorkerId === currentUser.id

  // Find user's application if they've applied (for non-owners)
  const workerApplication = isNotOwner
    ? applications?.find((app) => app.workerId === currentUser?.id)
    : null

  const hasApplied = !!workerApplication
  const isAssignedToSomeoneElse =
    !!chore.assignedWorkerId && chore.assignedWorkerId !== currentUser?.id

  // Non-owner can apply if:
  // - logged in
  // - chore is PUBLISHED
  // - no worker assigned yet
  // - user hasn't already applied
  const canApply =
    isNotOwner &&
    choreStatus === 'PUBLISHED' &&
    !chore.assignedWorkerId &&
    !hasApplied

  // Sync chore status when chore prop changes
  useEffect(() => {
    setChoreStatus(chore.status)
    setLatestCancellationRequest(initialLatestCancellationRequest)
  }, [chore.status, initialLatestCancellationRequest])

  // Load ratings on mount
  useEffect(() => {
    if (currentUser) {
      setLoadingRatings(true)
      fetch(`/api/chores/${chore.id}/rating`)
        .then((res) => res.json())
        .then((data) => {
          if (data.myRating) {
            setHasRated(true)
            setRatingScore(data.myRating.score)
            setRatingComment(data.myRating.comment || '')
            setMyRating(data.myRating)
          }
          if (data.choreRating) {
            setChoreRating(data.choreRating)
          }
        })
        .catch((error) => {
          console.error('Error loading ratings:', error)
        })
        .finally(() => {
          setLoadingRatings(false)
        })
    }
  }, [chore.id, currentUser])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Client-side validation
    if (!message || message.trim().length < 10) {
      setError('Please provide a message with at least 10 characters explaining why you\'re a good fit.')
      return
    }
    
    setSubmitting(true)

    try {
      const response = await fetch(`/api/chores/${chore.id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidAmount: bidAmount ? parseFloat(bidAmount) : undefined,
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          toast.error('Rate limited', 'You are applying too frequently. Please try again later.')
          setError('You are applying too frequently. Please try again later.')
        } else if (response.status === 400 && data.details) {
          // Validation error with details
          const fieldErrors = data.details?.fieldErrors || {}
          const errorMessages = Object.values(fieldErrors).flat().join('. ')
          toast.error('Validation error', errorMessages || 'Please check your input.')
          setError(errorMessages || data.error || 'Please check your input and try again.')
        } else if (response.status === 409) {
          toast.warning('Already applied', 'You have already applied to this chore.')
          setError('You have already applied to this chore.')
        } else if (response.status === 403) {
          toast.error('Not allowed', data.error || 'You cannot apply to this chore.')
          setError(data.error || 'You are not allowed to apply to this chore.')
        } else if (response.status === 404) {
          toast.error('Not available', 'This chore is no longer available.')
          setError('This chore is no longer available.')
        } else {
          toast.error('Failed to apply', data.error || 'Please try again.')
          setError(data.error || 'Failed to submit application. Please try again.')
        }
        return
      }

      // Add the new application to the list if it exists
      if (data.application) {
        setApplications((prev) => (prev ? [...prev, data.application] : [data.application]))
      }
      
      toast.success('Application sent! 🎉', 'The customer will review your application.')
      setSuccess('🎉 Application submitted successfully! The customer will review your application.')
      setBidAmount('')
      setMessage('')
      router.refresh()
    } catch (err) {
      toast.error('Connection error', 'Please check your connection and try again.')
      setError('An error occurred. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssign = async (applicationId: string) => {
    if (!confirm('Are you sure you want to assign this chore to this worker?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/applications/${applicationId}/assign`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to assign application')
        return
      }

      setSuccess('Chore assigned successfully!')
      
      // Update applications state
      setApplications(
        applications.map((app) => {
          if (app.id === applicationId) {
            return { ...app, status: 'ACCEPTED' }
          }
          if (app.status === 'PENDING') {
            return { ...app, status: 'REJECTED' }
          }
          return app
        }),
      )
      
      // Update chore status in local state (optimistic update)
      // The router.refresh() will fetch the updated chore from the server
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (action: 'start' | 'complete') => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/chores/${chore.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update status')
        return
      }

      setSuccess(
        action === 'start'
          ? 'Chore marked as in progress!'
          : 'Chore marked as completed!',
      )
      if (data.chore) {
        setChoreStatus(data.chore.status)
      }
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmittingRating(true)

    try {
      const response = await fetch(`/api/chores/${chore.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: ratingScore,
          comment: ratingComment || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit rating')
        return
      }

      setSuccess('Rating submitted successfully!')
      setHasRated(true)
      setMyRating(data.rating)
      setChoreRating(data.rating)
      // Pre-fill form with submitted rating
      setRatingScore(data.rating.score)
      setRatingComment(data.rating.comment || '')
      // Refresh ratings from server
      const refreshRes = await fetch(`/api/chores/${chore.id}/rating`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        if (refreshData.myRating) {
          setMyRating(refreshData.myRating)
        }
        if (refreshData.choreRating) {
          setChoreRating(refreshData.choreRating)
        }
      }
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleDirectCancel = async () => {
    const reason = prompt('Why are you cancelling this chore? (optional)')
    if (reason === null) return // User cancelled prompt

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/chores/${chore.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel chore')
        return
      }

      setSuccess('Chore cancelled successfully')
      setChoreStatus('CANCELLED')
      router.refresh()
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCancellation = async () => {
    const reason = prompt('Why do you want to cancel? (optional)')
    if (reason === null) return // User cancelled prompt

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/chores/${chore.id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to request cancellation')
        return
      }

      setSuccess('Cancellation request submitted')
      setChoreStatus('CANCELLATION_REQUESTED')
      setLatestCancellationRequest(data.cancellationRequest)
      router.refresh()
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancellationDecision = async (decision: 'APPROVE' | 'REJECT') => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/chores/${chore.id}/cancel-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || `Failed to ${decision.toLowerCase()} cancellation`)
        return
      }

      setSuccess(
        decision === 'APPROVE'
          ? 'Cancellation approved. Chore is now cancelled.'
          : 'Cancellation request rejected. Chore status restored.'
      )
      setChoreStatus(data.chore.status)
      setLatestCancellationRequest(null)
      router.refresh()
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string): 'statusDraft' | 'statusPublished' | 'statusAssigned' | 'statusInProgress' | 'statusCompleted' | 'statusCancelled' => {
    switch (status) {
      case 'DRAFT':
        return 'statusDraft'
      case 'PUBLISHED':
        return 'statusPublished'
      case 'ASSIGNED':
        return 'statusAssigned'
      case 'IN_PROGRESS':
        return 'statusInProgress'
      case 'COMPLETED':
        return 'statusCompleted'
      case 'CANCELLED':
        return 'statusCancelled'
      case 'CANCELLATION_REQUESTED':
        return 'statusCancelled' // Use cancelled style for now
      default:
        return 'statusDraft'
    }
  }

  const getTypeBadgeVariant = (type: ChoreType): 'typeOnline' | 'typeOffline' => {
    switch (type) {
      case 'ONLINE':
        return 'typeOnline'
      case 'OFFLINE':
        return 'typeOffline'
      default:
        return 'typeOnline'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Status debug line */}
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Status: {choreStatus} | View: {isOwner ? 'Owner' : isNotOwner ? 'Applicant' : 'Guest'}
        </div>

        {/* Back button - source aware */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back()
              return
            }
            router.push(backHref)
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {backLabel}
        </button>

        {/* Cancelled Banner */}
        {choreStatus === 'CANCELLED' && (
          <Card className="mb-6 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              This chore has been cancelled.
            </h2>
            {latestCancellationRequest?.reason && (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Reason: {latestCancellationRequest.reason}
              </p>
            )}
          </Card>
        )}

        {/* Chore details */}
        <Card className="mb-6">
          {/* Chore Image */}
          {chore.imageUrl && (
            <div className="mb-6 -mx-4 sm:-mx-6">
              <img
                src={chore.imageUrl}
                alt={chore.title}
                className="w-full h-64 object-cover rounded-t-xl"
              />
            </div>
          )}
          
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{chore.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Badge variant={getTypeBadgeVariant(chore.type)}>
                  {chore.type}
                </Badge>
                <Badge variant={getStatusBadgeVariant(choreStatus)}>
                  {choreStatus.replace('_', ' ')}
                </Badge>
              </div>
              {isOwner &&
                choreStatus !== 'COMPLETED' &&
                choreStatus !== 'CANCELLED' &&
                choreStatus !== 'CANCELLATION_REQUESTED' && (
                  <Link href={`/chores/${chore.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
              {isOwner &&
                (choreStatus === 'DRAFT' || choreStatus === 'PUBLISHED') && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDirectCancel}
                    disabled={loading}
                  >
                    Cancel Chore
                  </Button>
                )}
            </div>
          </div>

            <div className="mb-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</h3>
                <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {chore.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Type</h3>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{chore.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</h3>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{chore.category}</p>
                </div>
                {chore.budget && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget</h3>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">${chore.budget}</p>
                  </div>
                )}
                {chore.dueAt && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Due Date</h3>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {formatDate(chore.dueAt)}
                    </p>
                  </div>
                )}
              </div>

              {chore.type === 'OFFLINE' && chore.locationAddress && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</h3>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{chore.locationAddress}</p>
                </div>
              )}

              {/* Location Map - Only for OFFLINE chores with coordinates */}
              {chore.type === 'OFFLINE' &&
                chore.locationLat &&
                chore.locationLng && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Location Map
                    </h3>
                    <MapPreview
                      lat={chore.locationLat}
                      lng={chore.locationLng}
                      heightClass="h-64"
                      markerLabel={chore.locationAddress || chore.title}
                    />
                  </div>
                )}

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Posted by</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{chore.createdBy.name}</p>
              </div>

              {chore.assignedWorker && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned to</h3>
                  <div className="mt-1">
                    <Link
                      href={`/profile/${chore.assignedWorker.id}`}
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      {chore.assignedWorker.name}
                    </Link>
                    {assignedWorkerRating && assignedWorkerRating.count > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= Math.round(assignedWorkerRating.average)
                                  ? 'text-yellow-400'
                                  : 'text-slate-400 dark:text-slate-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {assignedWorkerRating.average.toFixed(1)} ({assignedWorkerRating.count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
            <div className="flex-shrink-0 p-1 rounded-full bg-red-100 dark:bg-red-800/50">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Something went wrong</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3">
            <div className="flex-shrink-0 p-1 rounded-full bg-emerald-100 dark:bg-emerald-800/50">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">Success!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Worker: Assigned to this worker */}
        {isAssignedWorker && (
          <Card className="mb-6 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              You are assigned to this chore.
            </p>
          </Card>
        )}

        {/* Non-owner: Assigned to someone else - hide apply UI */}
        {isNotOwner && isAssignedToSomeoneElse && (
          <Card className="mb-6 border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This chore has been assigned to another worker.
            </p>
          </Card>
        )}

        {/* Non-owner: Already applied - Show application summary */}
        {isNotOwner && hasApplied && !isAssignedWorker && workerApplication && (
          <Card className="mb-6 border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-800/50">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                  Application Submitted
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  You&apos;ve already applied to this chore. Here&apos;s your application summary:
                </p>
                <div className="space-y-2 text-sm">
                  {workerApplication.bidAmount && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Your Bid:</span>
                      <span className="text-emerald-700 dark:text-emerald-300">${workerApplication.bidAmount}</span>
                    </div>
                  )}
                  {workerApplication.message && (
                    <div>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Your Message:</span>
                      <p className="mt-1 text-emerald-700 dark:text-emerald-300 italic">&quot;{workerApplication.message}&quot;</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-emerald-800 dark:text-emerald-200">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      workerApplication.status === 'ACCEPTED' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200'
                        : workerApplication.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200'
                    }`}>
                      {workerApplication.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Worker: Prominent Apply Now CTA */}
        {canApply && (
          <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/20">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    Ready to take on this chore?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submit your application and let the customer know why you&apos;re the best fit.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const formElement = document.getElementById('apply-form')
                  formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                variant="primary"
                size="lg"
                className="shadow-lg whitespace-nowrap"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Apply Now
              </Button>
            </div>
          </Card>
        )}

        {/* Worker: Apply/Bid form */}
        {canApply && (
          <div id="apply-form">
            <Card className="mb-6 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 py-4 mb-6 border-b border-primary/20">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Submit Your Application
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell the customer why you&apos;re the perfect match for this chore.
                </p>
              </div>

              <form onSubmit={handleApply} className="space-y-6">
                {/* Message/Pitch Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Why are you a good fit? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Share your relevant experience and why you&apos;d be great for this job.
                  </p>
                  <textarea
                    id="message"
                    rows={4}
                    required
                    minLength={10}
                    placeholder="I'm a great fit for this chore because..."
                    className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {message.length > 0 && message.length < 10 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Please write at least 10 characters ({10 - message.length} more needed)
                    </p>
                  )}
                </div>

                {/* Bid Amount Field */}
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Your Expected Amount
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {chore.budget 
                      ? `The customer's budget is $${chore.budget}. You can match it or propose a different amount.`
                      : 'No budget specified. Propose your rate for this job.'}
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      type="number"
                      id="bidAmount"
                      min="0"
                      step="1"
                      placeholder={chore.budget ? String(chore.budget) : 'Enter amount'}
                      className="block w-full rounded-xl border border-border bg-background pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || message.length < 10}
                    variant="primary"
                    size="lg"
                    className="w-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Customer: Applications Panel */}
        {isOwner && applications && (
          <CustomerApplicationsPanel
            applications={applications}
            choreId={chore.id}
            choreStatus={choreStatus}
          />
        )}

        {/* Customer: Cancellation Request Decision */}
        {isOwner &&
          choreStatus === 'CANCELLATION_REQUESTED' &&
          latestCancellationRequest && (
            <Card className="mb-6 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Cancellation Requested
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <span className="font-medium">Worker:</span>{' '}
                    {latestCancellationRequest.requestedBy?.name || 'Unknown'}
                  </p>
                  {latestCancellationRequest.reason ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Reason:</span>{' '}
                      {latestCancellationRequest.reason}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No reason provided
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCancellationDecision('APPROVE')}
                    disabled={loading}
                    variant="danger"
                  >
                    {loading ? 'Processing...' : 'Approve Cancellation'}
                  </Button>
                  <Button
                    onClick={() => handleCancellationDecision('REJECT')}
                    disabled={loading}
                    variant="secondary"
                  >
                    {loading ? 'Processing...' : 'Reject Request'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

        {/* Assigned Worker: Status update buttons */}
        {isAssignedWorker && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Update Status
            </h2>
            <div className="flex gap-3">
              {choreStatus === 'ASSIGNED' && (
                <Button
                  onClick={() => handleStatusUpdate('start')}
                  disabled={loading}
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
                >
                  {loading ? 'Updating...' : 'Start Chore'}
                </Button>
              )}
              {choreStatus === 'IN_PROGRESS' && (
                <Button
                  onClick={() => handleStatusUpdate('complete')}
                  disabled={loading}
                  variant="primary"
                  className="bg-green-600 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-400"
                >
                  {loading ? 'Updating...' : 'Mark as Completed'}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Worker: Request Cancellation */}
        {isAssignedWorker &&
          (choreStatus === 'ASSIGNED' || choreStatus === 'IN_PROGRESS') &&
          !latestCancellationRequest && (
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Request Cancellation
              </h2>
              <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                If you need to cancel this chore, you can request cancellation. The customer will
                need to approve or reject your request.
              </p>
              <Button
                onClick={handleRequestCancellation}
                disabled={loading}
                variant="danger"
              >
                {loading ? 'Submitting...' : 'Request Cancellation'}
              </Button>
            </Card>
          )}

        {/* Worker: Cancellation Requested Status */}
        {isAssignedWorker &&
          choreStatus === 'CANCELLATION_REQUESTED' &&
          latestCancellationRequest &&
          latestCancellationRequest.requestedById === currentUser?.id && (
            <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Cancellation Requested
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                You have requested cancellation. Waiting for customer&apos;s decision.
              </p>
            </Card>
          )}

        {/* Rating for this chore - Read-only card visible to all users */}
        {choreRating && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
              Rating for this Chore
            </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= choreRating.score
                          ? 'text-yellow-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                    {choreRating.score}/5
                  </span>
                </div>
                {choreRating.comment && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">{choreRating.comment}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By {choreRating.fromUser.name}
                </p>
              </div>
            </Card>
        )}

        {/* Rating Form - Only for owner after COMPLETED */}
        {currentUser &&
          isOwner &&
          choreStatus === 'COMPLETED' &&
          !hasRated && (
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
                Rate Worker
              </h2>
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Rating (1-5 stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingScore(star)}
                          className={`text-2xl ${
                            star <= ratingScore
                              ? 'text-yellow-400'
                              : 'text-slate-400 dark:text-slate-600'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                        ({ratingScore}/5)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="ratingComment"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Comment (optional)
                    </label>
                    <textarea
                      id="ratingComment"
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Share your experience..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submittingRating}
                    variant="primary"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </form>
              </Card>
          )}

        {/* Rating info message - show when COMPLETED but user is not owner */}
        {choreStatus === 'COMPLETED' &&
          currentUser &&
          !isOwner && (
            <Card className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">Rating</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Only the customer can rate this chore.
              </p>
            </Card>
          )}

        {/* Chat - Only visible when assigned and status allows */}
        {currentUser &&
          (isOwner || isAssignedWorker) &&
          chore.assignedWorkerId &&
          (choreStatus === 'ASSIGNED' ||
            choreStatus === 'IN_PROGRESS' ||
            choreStatus === 'COMPLETED') && (
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Chat</h2>
              <ChoreChat choreId={chore.id} currentUserId={currentUser.id} />
            </Card>
          )}

        {/* Chat unavailable message - show when user is owner/assigned worker but chat not available yet */}
        {currentUser &&
          (isOwner || isAssignedWorker) &&
          (!chore.assignedWorkerId ||
            (choreStatus !== 'ASSIGNED' &&
              choreStatus !== 'IN_PROGRESS' &&
              choreStatus !== 'COMPLETED')) && (
            <Card className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">Chat</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chat becomes available once the chore has been assigned to a worker.
              </p>
            </Card>
          )}
      </div>
    </div>
  )
}