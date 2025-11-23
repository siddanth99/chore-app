'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, ChoreType } from '@prisma/client'
import ChoreChat from '@/features/chat/chore-chat'
import MapPreview from '@/components/MapPreview'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface ChoreDetailClientProps {
  chore: any
  currentUser: any
  initialApplications: any[] | null
  hasRated?: boolean
  assignedWorkerRating?: { average: number; count: number } | null
}

export default function ChoreDetailClient({
  chore,
  currentUser,
  initialApplications,
  hasRated: initialHasRated = false,
  assignedWorkerRating = null,
}: ChoreDetailClientProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const isOwner =
    currentUser && currentUser.role === 'CUSTOMER' && chore.createdById === currentUser.id
  const isWorker = currentUser && currentUser.role === 'WORKER'
  const isAssignedWorker = currentUser && chore.assignedWorkerId === currentUser.id

  // Worker can apply only if:
  // - logged in
  // - role = WORKER
  // - chore is PUBLISHED
  // - no worker assigned yet
  const canApply =
    !!currentUser &&
    currentUser.role === 'WORKER' &&
    chore.status === 'PUBLISHED' &&
    !chore.assignedWorkerId

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
    setSubmitting(true)

    try {
      const response = await fetch(`/api/chores/${chore.id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidAmount: bidAmount ? parseFloat(bidAmount) : undefined,
          message: message || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit application')
        return
      }

      setSuccess('Application submitted successfully!')
      setBidAmount('')
      setMessage('')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
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

  const getStatusBadgeVariant = (status: ChoreStatus): 'statusDraft' | 'statusPublished' | 'statusAssigned' | 'statusInProgress' | 'statusCompleted' | 'statusCancelled' => {
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
          Status: {chore.status} | You are: {currentUser?.role ?? 'Guest'}
        </div>

        {/* Back link */}
        <Link
          href="/chores"
          className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          ← Back to Chores
        </Link>

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{chore.title}</h1>
            <div className="flex gap-2">
              <Badge variant={getTypeBadgeVariant(chore.type)}>
                {chore.type}
              </Badge>
              <Badge variant={getStatusBadgeVariant(chore.status)}>
                {chore.status.replace('_', ' ')}
              </Badge>
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
                      {new Date(chore.dueAt).toLocaleDateString()}
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
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Worker: Prominent Apply Now button */}
        {canApply && (
          <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Interested in this chore?
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Apply now to get started and submit your bid.
                </p>
              </div>
              <Button
                onClick={() => {
                  const formElement = document.getElementById('apply-form')
                  formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                variant="primary"
                size="lg"
                className="shadow-lg"
              >
                Apply Now
              </Button>
            </div>
          </Card>
        )}

        {/* Worker: Apply/Bid form */}
        {canApply && (
          <div id="apply-form">
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
                Apply for this Chore
              </h2>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Bid Amount (optional)
                  </label>
                  <input
                    type="number"
                    id="bidAmount"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Message (optional)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Customer: Applications list */}
        {isOwner && applications && applications.length > 0 && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
              Applications ({applications.length})
            </h2>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-50">
                            {app.worker.name}
                          </h3>
                          {app.workerRating && app.workerRating.count > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= Math.round(app.workerRating.average)
                                        ? 'text-yellow-400'
                                        : 'text-slate-400 dark:text-slate-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {app.workerRating.average.toFixed(1)} ({app.workerRating.count})
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {app.worker.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          app.status === 'ACCEPTED'
                            ? 'statusCompleted'
                            : app.status === 'REJECTED'
                            ? 'statusCancelled'
                            : 'statusPublished'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                    {app.bidAmount && (
                      <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Bid:</span> ${app.bidAmount}
                      </p>
                    )}
                    {app.message && (
                      <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">{app.message}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    {app.status === 'PENDING' && chore.status === 'PUBLISHED' && (
                      <Button
                        onClick={() => handleAssign(app.id)}
                        disabled={loading}
                        variant="primary"
                        size="sm"
                        className="mt-2 bg-green-600 hover:bg-green-500"
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
        )}

        {isOwner && applications && applications.length === 0 && (
          <Card className="mb-6 text-center">
            <div className="max-w-md mx-auto py-8">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                No applications yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Workers will see this in their nearby list if location is set. Check back soon!
              </p>
            </div>
          </Card>
        )}

        {/* Assigned Worker: Status update buttons */}
        {isAssignedWorker && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
              Update Status
            </h2>
            <div className="flex gap-3">
              {chore.status === 'ASSIGNED' && (
                <Button
                  onClick={() => handleStatusUpdate('start')}
                  disabled={loading}
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
                >
                  {loading ? 'Updating...' : 'Start Chore'}
                </Button>
              )}
              {chore.status === 'IN_PROGRESS' && (
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

        {/* Rating Form - Only for CUSTOMER after COMPLETED */}
        {currentUser &&
          currentUser.role === 'CUSTOMER' &&
          isOwner &&
          chore.status === 'COMPLETED' &&
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

        {/* Rating info message - show when COMPLETED but user is not customer */}
        {chore.status === 'COMPLETED' &&
          currentUser &&
          currentUser.role !== 'CUSTOMER' &&
          !isOwner && (
            <Card className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">Rating</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Only the customer can rate this chore.
              </p>
            </Card>
          )}

        {/* Chat - Only visible when assigned and status allows */}
        {currentUser &&
          (isOwner || isAssignedWorker) &&
          chore.assignedWorkerId &&
          (chore.status === 'ASSIGNED' ||
            chore.status === 'IN_PROGRESS' ||
            chore.status === 'COMPLETED') && (
            <Card className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">Chat</h2>
              <ChoreChat choreId={chore.id} currentUserId={currentUser.id} />
            </Card>
          )}

        {/* Chat unavailable message - show when user is owner/assigned worker but chat not available yet */}
        {currentUser &&
          (isOwner || isAssignedWorker) &&
          (!chore.assignedWorkerId ||
            (chore.status !== 'ASSIGNED' &&
              chore.status !== 'IN_PROGRESS' &&
              chore.status !== 'COMPLETED')) && (
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