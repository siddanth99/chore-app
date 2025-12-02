'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, ChoreType } from '@prisma/client'
import ChoreChat from '@/features/chat/chore-chat'
import MapPreview from '@/components/MapPreview'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface PaymentSummary {
  totalFromCustomer: number
  totalToWorker: number
  agreedPrice: number | null
  paymentStatus: 'NONE' | 'CUSTOMER_PARTIAL' | 'CUSTOMER_PAID' | 'SETTLED'
}

interface Payment {
  id: string
  amount: number
  direction: string
  method: string
  notes: string | null
  createdAt: string
  fromUser: {
    id: string
    name: string | null
    email: string | null
  }
  toUser: {
    id: string
    name: string | null
    email: string | null
  }
}

interface ChoreDetailClientProps {
  chore: any
  currentUser: any
  initialApplications: any[] | null
  hasRated?: boolean
  assignedWorkerRating?: { average: number; count: number } | null
  latestCancellationRequest?: any | null
  payments?: Payment[] | null
  paymentSummary?: PaymentSummary | null
}

export default function ChoreDetailClient({
  chore,
  currentUser,
  initialApplications,
  hasRated: initialHasRated = false,
  assignedWorkerRating = null,
  latestCancellationRequest: initialLatestCancellationRequest = null,
  payments: initialPayments = null,
  paymentSummary: initialPaymentSummary = null,
}: ChoreDetailClientProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications || [])
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

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [payDirection, setPayDirection] = useState<'CUSTOMER_TO_OWNER' | 'OWNER_TO_WORKER'>(
    'CUSTOMER_TO_OWNER'
  )
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'>(
    'CASH'
  )
  const [payNotes, setPayNotes] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)
  const [payError, setPayError] = useState('')

  const isOwner =
    currentUser && currentUser.role === 'CUSTOMER' && chore.createdById === currentUser.id
  const isWorker = currentUser && currentUser.role === 'WORKER'
  const isAssignedWorker = currentUser && chore.assignedWorkerId === currentUser.id
  const canViewPayments = isOwner || isAssignedWorker
  const canAddPayments =
    isOwner &&
    (choreStatus === 'ASSIGNED' ||
      choreStatus === 'IN_PROGRESS' ||
      choreStatus === 'COMPLETED')

  // Find worker's application if they're a worker
  const workerApplication = isWorker
    ? applications?.find((app) => app.workerId === currentUser?.id)
    : null

  const hasApplied = !!workerApplication
  const isAssignedToSomeoneElse =
    !!chore.assignedWorkerId && chore.assignedWorkerId !== currentUser?.id

  // Worker can apply only if:
  // - logged in
  // - role = WORKER
  // - chore is PUBLISHED
  // - no worker assigned yet
  // - worker hasn't already applied
  const canApply =
    isWorker &&
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

      // Add the new application to the list if it exists
      if (data.application) {
        setApplications((prev) => (prev ? [...prev, data.application] : [data.application]))
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

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayError('')
    setPaySubmitting(true)

    try {
      const amountNumber = parseFloat(payAmount)
      if (!amountNumber || amountNumber <= 0) {
        setPayError('Enter a valid amount')
        setPaySubmitting(false)
        return
      }

      const res = await fetch(`/api/chores/${chore.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNumber,
          direction: payDirection,
          method: payMethod,
          notes: payNotes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPayError(data.error || 'Failed to record payment')
        setPaySubmitting(false)
        return
      }

      // Clear form
      setPayAmount('')
      setPayNotes('')

      // Refresh payments from server
      router.refresh()
    } catch (err) {
      setPayError('An error occurred while recording payment')
    } finally {
      setPaySubmitting(false)
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
          Status: {choreStatus} | You are: {currentUser?.role ?? 'Guest'}
        </div>

        {/* Back link */}
        <Link
          href="/chores"
          className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          ← Back to Chores
        </Link>

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

        {/* Worker: Assigned to this worker */}
        {isAssignedWorker && (
          <Card className="mb-6 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              You are assigned to this chore.
            </p>
          </Card>
        )}

        {/* Worker: Assigned to someone else - hide apply UI */}
        {isWorker && isAssignedToSomeoneElse && (
          <Card className="mb-6 border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This chore has been assigned to another worker.
            </p>
          </Card>
        )}

        {/* Worker: Already applied */}
        {isWorker && hasApplied && !isAssignedWorker && (
          <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <Button
              variant="secondary"
              size="md"
              disabled
              className="w-full sm:w-auto"
            >
              Applied (View Application)
            </Button>
          </Card>
        )}

        {/* Worker: Prominent Apply Now button */}
        {canApply && (
          <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
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
                          {(app.workerRating || app.workerAverageRating) && (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const rating = app.workerRating?.average || app.workerAverageRating || 0
                                  return (
                                    <span
                                      key={star}
                                      className={`text-xs ${
                                        star <= Math.round(rating)
                                          ? 'text-yellow-400'
                                          : 'text-slate-400 dark:text-slate-600'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  )
                                })}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {((app.workerRating?.average || app.workerAverageRating) || 0).toFixed(1)} / 5
                                {(app.workerRating?.count || app.workerRatingCount) ? ` (${app.workerRating?.count || app.workerRatingCount} reviews)` : ''}
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
                    {app.status === 'PENDING' && choreStatus === 'PUBLISHED' && (
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

        {/* Rating Form - Only for CUSTOMER after COMPLETED */}
        {currentUser &&
          currentUser.role === 'CUSTOMER' &&
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

        {/* Rating info message - show when COMPLETED but user is not customer */}
        {choreStatus === 'COMPLETED' &&
          currentUser &&
          currentUser.role !== 'CUSTOMER' &&
          !isOwner && (
            <Card className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">Rating</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Only the customer can rate this chore.
              </p>
            </Card>
          )}

        {/* Payments & Earnings Section */}
        {canViewPayments && initialPaymentSummary && (
          <Card className="mb-6">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Payments & Earnings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Internal record of payments related to this chore.
                </p>
              </div>

              {/* Payment status badge */}
              <Badge
                variant={
                  initialPaymentSummary.paymentStatus === 'NONE'
                    ? 'statusDraft'
                    : initialPaymentSummary.paymentStatus === 'CUSTOMER_PARTIAL'
                    ? 'statusInProgress'
                    : initialPaymentSummary.paymentStatus === 'CUSTOMER_PAID'
                    ? 'statusPublished'
                    : 'statusCompleted'
                }
              >
                {initialPaymentSummary.paymentStatus.replace('_', ' ')}
              </Badge>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Agreed Price</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {initialPaymentSummary.agreedPrice != null
                    ? `$${initialPaymentSummary.agreedPrice}`
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">From Customer</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  ${initialPaymentSummary.totalFromCustomer}
                  {initialPaymentSummary.agreedPrice
                    ? ` / $${initialPaymentSummary.agreedPrice}`
                    : ''}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">To Worker</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  ${initialPaymentSummary.totalToWorker}
                </p>
              </div>
            </div>

            {/* Add Payment Form */}
            {canAddPayments && (
              <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
                <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Add Internal Payment
                </h3>
                {payError && (
                  <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {payError}
                  </div>
                )}

                <form onSubmit={handleAddPayment} className="grid gap-3 md:grid-cols-4">
                  {/* Amount */}
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Direction */}
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Direction
                    </label>
                    <select
                      value={payDirection}
                      onChange={(e) =>
                        setPayDirection(
                          e.target.value as 'CUSTOMER_TO_OWNER' | 'OWNER_TO_WORKER'
                        )
                      }
                      className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="CUSTOMER_TO_OWNER">Customer → Owner</option>
                      <option value="OWNER_TO_WORKER">Owner → Worker</option>
                    </select>
                  </div>

                  {/* Method */}
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) =>
                        setPayMethod(
                          e.target.value as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'
                        )
                      }
                      className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Notes + Submit */}
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="e.g. Advance, balance, cash at site"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={paySubmitting}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                    >
                      {paySubmitting ? 'Saving…' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment list */}
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                Payment History
              </h3>

              {(!initialPayments || initialPayments.length === 0) ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No payments recorded yet for this chore.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">From</th>
                        <th className="py-2 pr-4">To</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Direction</th>
                        <th className="py-2 pr-4">Method</th>
                        <th className="py-2 pr-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {initialPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {p.fromUser?.name || p.fromUser?.email || 'Unknown'}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {p.toUser?.name || p.toUser?.email || 'Unknown'}
                          </td>
                          <td className="py-2 pr-4 text-slate-900 dark:text-slate-50 font-semibold">
                            ${p.amount}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {p.direction.replace(/_/g, ' → ')}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {p.method.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                            {p.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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