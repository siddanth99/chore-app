'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, UserRole } from '@prisma/client'
import ChoreChat from '@/features/chat/chore-chat'

interface ChoreDetailClientProps {
  chore: any
  currentUser: any
  initialApplications: any[] | null
  hasRated?: boolean
}

export default function ChoreDetailClient({
  chore,
  currentUser,
  initialApplications,
  hasRated: initialHasRated = false,
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

  const isOwner = currentUser && currentUser.role === 'CUSTOMER' && chore.createdById === currentUser.id
  const isWorker = currentUser && currentUser.role === 'WORKER'
  const isAssignedWorker = currentUser && chore.assignedWorkerId === currentUser.id

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
        })
      )
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
          : 'Chore marked as completed!'
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
      setRatingComment('')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusBadgeColor = (status: ChoreStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED':
        return 'bg-orange-100 text-orange-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ONLINE':
        return 'bg-indigo-100 text-indigo-800'
      case 'OFFLINE':
        return 'bg-teal-100 text-teal-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/chores"
          className="text-sm text-blue-600 hover:text-blue-500 mb-4 inline-block"
        >
          ← Back to Chores
        </Link>

        {/* Chore details */}
        <div className="rounded-lg bg-white shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{chore.title}</h1>
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getTypeBadgeColor(
                    chore.type
                  )}`}
                >
                  {chore.type}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeColor(
                    chore.status
                  )}`}
                >
                  {chore.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{chore.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-gray-900">{chore.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-gray-900">{chore.category}</p>
                </div>
                {chore.budget && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                    <p className="mt-1 text-gray-900">${chore.budget}</p>
                  </div>
                )}
                {chore.dueAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="mt-1 text-gray-900">
                      {new Date(chore.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {chore.type === 'OFFLINE' && chore.locationAddress && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-gray-900">{chore.locationAddress}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">Posted by</h3>
                <p className="mt-1 text-gray-900">{chore.createdBy.name}</p>
              </div>

              {chore.assignedWorker && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned to</h3>
                  <Link
                    href={`/profile/${chore.assignedWorker.id}`}
                    className="mt-1 text-gray-900 hover:text-blue-600"
                  >
                    {chore.assignedWorker.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Worker: Prominent Apply Now button */}
        {isWorker && chore.status === 'PUBLISHED' && !isAssignedWorker && (
          <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interested in this chore?
                </h3>
                <p className="text-sm text-gray-600">
                  Apply now to get started and submit your bid.
                </p>
              </div>
              <button
                onClick={() => {
                  const formElement = document.getElementById('apply-form')
                  formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 shadow-lg"
              >
                Apply Now
              </button>
            </div>
          </div>
        )}

        {/* Worker: Apply/Bid form */}
        {isWorker && chore.status === 'PUBLISHED' && !isAssignedWorker && (
          <div id="apply-form">
            <div className="rounded-lg bg-white shadow mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for this Chore</h2>
                <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Bid Amount (optional)
                  </label>
                  <input
                    type="number"
                    id="bidAmount"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Message (optional)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Customer: Applications list */}
        {isOwner && applications && applications.length > 0 && (
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Applications ({applications.length})
              </h2>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{app.worker.name}</h3>
                        <p className="text-sm text-gray-500">{app.worker.email}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          app.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    {app.bidAmount && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Bid:</span> ${app.bidAmount}
                      </p>
                    )}
                    {app.message && (
                      <p className="text-sm text-gray-600 mb-2">{app.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                    {app.status === 'PENDING' && chore.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleAssign(app.id)}
                        disabled={loading}
                        className="mt-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isOwner && applications && applications.length === 0 && (
          <div className="rounded-lg bg-white shadow p-6">
            <p className="text-gray-500">No applications yet.</p>
          </div>
        )}

        {/* Assigned Worker: Status update buttons */}
        {isAssignedWorker && (
          <div className="rounded-lg bg-white shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
              {chore.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusUpdate('start')}
                  disabled={loading}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Start Chore'}
                </button>
              )}
              {chore.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate('complete')}
                  disabled={loading}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rating Form - Only for CUSTOMER after COMPLETED */}
        {isOwner && chore.status === 'COMPLETED' && !hasRated && currentUser.role === 'CUSTOMER' && (
          <div className="rounded-lg bg-white shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Worker</h2>
              <form onSubmit={handleSubmitRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className={`text-2xl ${
                          star <= ratingScore ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      ({ratingScore}/5)
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ratingComment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Comment (optional)
                  </label>
                  <textarea
                    id="ratingComment"
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Chat - Only visible when assigned and status allows */}
        {(isOwner || isAssignedWorker) &&
          chore.assignedWorkerId &&
          (chore.status === 'ASSIGNED' ||
            chore.status === 'IN_PROGRESS' ||
            chore.status === 'COMPLETED') && (
            <div className="rounded-lg bg-white shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat</h2>
                <ChoreChat choreId={chore.id} currentUserId={currentUser.id} />
              </div>
            </div>
          )}

        {/* Chat unavailable message */}
        {(isOwner || isAssignedWorker) &&
          (!chore.assignedWorkerId ||
            (chore.status !== 'ASSIGNED' &&
              chore.status !== 'IN_PROGRESS' &&
              chore.status !== 'COMPLETED')) && (
            <div className="rounded-lg bg-white shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat</h2>
                <p className="text-sm text-gray-600">
                  Chat becomes available once the chore is assigned.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

