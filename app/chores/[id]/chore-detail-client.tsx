'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Clock, Calendar, DollarSign, User, Star, 
  CheckCircle, Send, ArrowLeft, Paperclip, MessageSquare,
  Shield, Briefcase, Heart, ChevronRight, Award, Zap, X
} from 'lucide-react'
import { ChoreStatus, ChoreType } from '@prisma/client'
import { ChatPanel } from '@/components/chat/ChatPanel'
import MapPreview from '@/components/MapPreview'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/components/chores/categories'
import CustomerApplicationsPanel from '@/components/applications/CustomerApplicationsPanel'
import { useToast } from '@/components/ui/toast'
import ThemeToggle from '@/components/theme/ThemeToggle'

interface ChoreDetailClientProps {
  chore: any
  currentUser: any
  initialApplications: any[] | null
  userApplication?: any | null
  hasRated?: boolean
  assignedWorkerRating?: { average: number; count: number } | null
  latestCancellationRequest?: any | null
}

export default function ChoreDetailClient({
  chore,
  currentUser,
  initialApplications,
  userApplication: initialUserApplication = null,
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
  
  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  // Selected application for customer chat
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

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

  // Use the userApplication prop (from server) or find from applications (fallback)
  const workerApplication = initialUserApplication || (isNotOwner
    ? applications?.find((app) => app.workerId === currentUser?.id)
    : null)

  const hasApplied = !!workerApplication
  const isAssignedToSomeoneElse =
    !!chore.assignedWorkerId && chore.assignedWorkerId !== currentUser?.id

  // Non-owner can apply if:
  // - logged in
  // - chore is OPEN (new state machine)
  // - no worker assigned yet
  // - user hasn't already applied
  const canApply =
    isNotOwner &&
    (choreStatus === 'OPEN' || choreStatus === 'PUBLISHED') && // Support both old and new statuses
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
        // Update workerApplication state to immediately show "Already Applied" UI
        // The router.refresh() will also reload the page with the new userApplication prop
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

  const handlePayForChore = async () => {
    if (!chore.budget || typeof window === 'undefined' || !(window as any).Razorpay) {
      setError('Razorpay SDK not loaded. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choreId: chore.id,
          // amount will be derived from chore.budget on the server
        }),
      });

      if (!orderResponse.ok) {
        // Robust error logging: try JSON first, then text, always log both
        let errorBody: any = null;
        let rawText: string | null = null;

        try {
          // Try JSON first
          errorBody = await orderResponse.json();
        } catch {
          try {
            rawText = await orderResponse.text();
          } catch {
            rawText = null;
          }
        }

        console.error("Failed to create order:", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          json: errorBody,
          text: rawText,
        });

        // Extract user-friendly error message
        const apiErrorMessage =
          errorBody && typeof errorBody === "object" && "error" in errorBody
            ? String(errorBody.error)
            : rawText || "Failed to create payment order. Please try again.";

        setError(apiErrorMessage);
        setLoading(false);
        return;
      }

      const { orderId, amount, currency } = await orderResponse.json();

      // Step 2: Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount, // already in paise from backend
        currency, // "INR"
        order_id: orderId,
        name: 'ChoreBid',
        description: `Payment for: ${chore.title}`,
        prefill: {
          name: currentUser?.name || 'Customer',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment signature
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorText = await verifyResponse.text();
              console.error('Failed to verify payment:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                response: errorText,
              });
              setError('Payment verification failed. Please contact support.');
              setLoading(false);
              return;
            }

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setSuccess('Payment successful! Your chore is now funded.');
              // Refresh the page to show updated payment status
              router.refresh();
            } else {
              setError(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Verification error:', error);
            setError('Error verifying payment');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSuccess('');
            setError('Payment cancelled');
            setLoading(false);
          },
        },
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError('An error occurred while processing payment');
      setLoading(false);
    }
  };

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

  // Helper component for Avatar
  const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
      <div className={cn(
        sizes[size],
        "rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold"
      )}>
        {initials}
        </div>
    );
  };

  // Helper component for Star Rating
  const StarRating = ({ rating, reviews }: { rating: number; reviews?: number }) => (
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-muted-foreground text-sm">({reviews})</span>
      )}
    </div>
  );

  // Determine chat mode
  const chatMode = chore.assignedWorkerId ? 'post-assignment' : 'pre-assignment';
  const otherPartyName = isOwner
    ? (chore.assignedWorker?.name || 'Worker')
    : (chore.createdBy?.name || 'Customer');

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header with Back Button */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back()
              return
            }
            router.push(backHref)
          }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel.replace('← ', '')}</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="w-full px-4 py-6 md:py-10 pb-24 md:pb-10">
        {/* Wrapper to center and constrain the chore header card */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-5xl">
        {/* Cancelled Banner */}
        {choreStatus === 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              This chore has been cancelled.
            </h2>
            {latestCancellationRequest?.reason && (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Reason: {latestCancellationRequest.reason}
              </p>
            )}
          </Card>
              </motion.div>
            )}

            {/* Beautiful Gradient Chore Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl glass-card"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative p-6 md:p-8">
                {/* Category & Status */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span>{getCategoryIcon(chore.category || '')}</span>
                    {chore.category}
                  </span>
                <Badge variant={getStatusBadgeVariant(choreStatus)}>
                  {choreStatus.replace('_', ' ')}
                </Badge>
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

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {chore.title}
                </h1>
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {chore.budget && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
              <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-semibold text-foreground">₹{chore.budget.toLocaleString('en-IN')}</p>
              </div>
                    </div>
                  )}
                  
                  {chore.type === 'OFFLINE' && chore.locationAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold text-foreground text-sm truncate">{chore.locationAddress}</p>
                </div>
                  </div>
                )}
                  
                {chore.dueAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="p-2 rounded-lg bg-highlight/10">
                        <Clock className="w-4 h-4 text-highlight" />
                      </div>
                  <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-semibold text-foreground text-sm">{formatDate(chore.dueAt)}</p>
                  </div>
              </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                <div>
                      <p className="text-xs text-muted-foreground">Posted</p>
                      <p className="font-semibold text-foreground text-sm">{formatDate(chore.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Chore Image */}
                {chore.imageUrl && (
                  <div className="relative h-32 md:h-40 rounded-xl overflow-hidden bg-muted/50 border border-border/50 mb-6">
                    <img
                      src={chore.imageUrl}
                      alt={chore.title}
                      className="w-full h-full object-cover"
                    />
                </div>
              )}

              {/* Location Map - Only for OFFLINE chores with coordinates */}
              {chore.type === 'OFFLINE' &&
                chore.locationLat &&
                chore.locationLng && (
                    <div className="relative h-32 md:h-40 rounded-xl overflow-hidden bg-muted/50 border border-border/50 mb-6">
                    <MapPreview
                      lat={chore.locationLat}
                      lng={chore.locationLng}
                        heightClass="h-full"
                      markerLabel={chore.locationAddress || chore.title}
                    />
                  </div>
                )}

                {/* Customer Info */}
                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={chore.createdBy?.name || 'User'} size="lg" />
              <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{chore.createdBy?.name || 'User'}</p>
                        </div>
                        {chore.createdBy?.email && (
                          <p className="text-xs text-muted-foreground">{chore.createdBy.email}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
              </div>

        {/* Lower Sections - Centered Layout */}
        <div className="w-full flex justify-center px-4">
          <div className="w-full max-w-5xl space-y-6 md:space-y-8">
            {/* Chore Description Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6 md:p-8"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Description
              </h2>
              
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
                {chore.description}
              </p>
              
              {/* Payment Status */}
              {chore.paymentStatus && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                  <p className={cn(
                    "font-semibold",
                    chore.paymentStatus === 'FUNDED' && "text-green-600 dark:text-green-400",
                    chore.paymentStatus === 'PENDING' && "text-yellow-600 dark:text-yellow-400",
                    chore.paymentStatus === 'UNPAID' && "text-red-600 dark:text-red-400",
                    chore.paymentStatus === 'REFUNDED' && "text-gray-600 dark:text-gray-400"
                  )}>
                    {chore.paymentStatus === 'FUNDED' && 'Paid ✔ (funded)'}
                    {chore.paymentStatus === 'PENDING' && 'Payment Pending...'}
                    {chore.paymentStatus === 'UNPAID' && 'Unpaid'}
                    {chore.paymentStatus === 'REFUNDED' && 'Refunded'}
                  </p>
                </div>
              )}
              
              {/* Owner: Pay for Chore button - Show when payment is UNPAID or PENDING and chore is active */}
              {(() => {
                // Explicitly check all conditions for showing the pay button
                // Allow both UNPAID and PENDING (PENDING means order created but not yet verified)
                const isPaymentPendingOrUnpaid = 
                  chore.paymentStatus === 'UNPAID' || 
                  chore.paymentStatus === 'PENDING' || 
                  chore.paymentStatus === null || 
                  chore.paymentStatus === undefined;
                
                const isChoreStatusPayable = 
                  choreStatus !== 'COMPLETED' &&
                  choreStatus !== 'CLOSED' &&
                  choreStatus !== 'CANCELED' &&
                  choreStatus !== 'CANCELLED';
                
                const shouldShowPayButton = 
                  isOwner && 
                  chore.budget && 
                  isPaymentPendingOrUnpaid && 
                  isChoreStatusPayable;
                
                return shouldShowPayButton ? (
                  <div className="mb-4">
                    <Button
                      onClick={handlePayForChore}
                      disabled={loading}
                      variant="primary"
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Processing...' : `Pay ₹${chore.budget.toLocaleString('en-IN')}`}
                    </Button>
                  </div>
                ) : null;
              })()}
              
              {/* Show message when payment is already completed */}
              {isOwner && chore.paymentStatus === 'FUNDED' && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    ✓ Payment completed
                  </p>
                </div>
              )}
              
              {/* Show message when payment is pending */}
              {/* {isOwner && chore.paymentStatus === 'PENDING' && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                    Payment processing...
                  </p>
                </div>
              )} */}
              
              {/* Assigned Worker Info */}
              {chore.assignedWorker && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground mb-2">Assigned to</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={chore.assignedWorker.name} size="md" />
                <div>
                    <Link
                      href={`/profile/${chore.assignedWorker.id}`}
                        className="font-semibold text-primary hover:underline"
                    >
                      {chore.assignedWorker.name}
                    </Link>
                    {assignedWorkerRating && assignedWorkerRating.count > 0 && (
                        <StarRating 
                          rating={assignedWorkerRating.average} 
                          reviews={assignedWorkerRating.count} 
                        />
                    )}
                  </div>
                </div>
            </div>
              )}
            </motion.div>

        {/* Error/Success messages */}
        {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3"
              >
            <div className="flex-shrink-0 p-1 rounded-full bg-red-100 dark:bg-red-800/50">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Something went wrong</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
            </div>
              </motion.div>
        )}
        {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3"
              >
            <div className="flex-shrink-0 p-1 rounded-full bg-emerald-100 dark:bg-emerald-800/50">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">Success!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">{success}</p>
            </div>
              </motion.div>
            )}

            {/* Worker: Status messages based on chore status */}
            {isAssignedWorker && choreStatus === 'ASSIGNED' && chore.paymentStatus !== 'FUNDED' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground font-medium">
                  You were assigned this job. Waiting for client payment to start.
                </p>
              </motion.div>
            )}
            {isAssignedWorker && choreStatus === 'FUNDED' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground font-medium mb-4">
                  ✔ Escrow Funded - You can now start the job
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/chores/${chore.id}/start`, {
                        method: 'POST',
                      })
                      if (response.ok) {
                        toast.success('Job started', 'You have started working on this chore.')
                        router.refresh()
                      } else {
                        const data = await response.json()
                        toast.error('Failed to start', data.error || 'Please try again.')
                      }
                    } catch (error) {
                      toast.error('Error', 'Failed to start chore.')
                    }
                  }}
                  variant="primary"
                >
                  Start Job
                </Button>
              </motion.div>
            )}
            {isAssignedWorker && choreStatus === 'IN_PROGRESS' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground font-medium mb-4">
                  Job in progress - Mark as complete when finished
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/chores/${chore.id}/complete`, {
                        method: 'POST',
                      })
                      if (response.ok) {
                        toast.success('Job completed', 'Waiting for client approval.')
                        router.refresh()
                      } else {
                        const data = await response.json()
                        toast.error('Failed to complete', data.error || 'Please try again.')
                      }
                    } catch (error) {
                      toast.error('Error', 'Failed to mark chore as complete.')
                    }
                  }}
                  variant="primary"
                >
                  Mark as Complete
                </Button>
              </motion.div>
            )}
            {isAssignedWorker && choreStatus === 'COMPLETED' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground font-medium">
                  ✔ Job completed - Awaiting client approval and payment release
                </p>
              </motion.div>
            )}
            {isAssignedWorker && choreStatus === 'CLOSED' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground font-medium">
                  ✔ Job completed - Payment released
                </p>
              </motion.div>
            )}

            {/* Non-owner: Assigned to someone else - hide apply UI */}
            {isNotOwner && isAssignedToSomeoneElse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
              >
                <p className="text-sm text-foreground">
              This chore has been assigned to another worker.
            </p>
              </motion.div>
            )}

            {/* Non-owner: Already applied - Show application summary */}
            {isNotOwner && hasApplied && !isAssignedWorker && workerApplication && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 backdrop-blur-xl shadow-lg p-6 md:p-8"
              >
            <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                    className="flex-shrink-0 p-3 rounded-xl bg-green-500/20"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </motion.div>
              <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                  Application Submitted
                </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                  You&apos;ve already applied to this chore. Here&apos;s your application summary:
                </p>
                    <div className="space-y-4">
                  {workerApplication.bidAmount && (
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Your Bid</p>
                          <p className="text-2xl font-bold text-foreground">
                            ₹{workerApplication.bidAmount.toLocaleString('en-IN')}
                          </p>
                    </div>
                  )}
                  {workerApplication.message && (
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Your Message</p>
                          <p className="text-foreground leading-relaxed">&quot;{workerApplication.message}&quot;</p>
                    </div>
                  )}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workerApplication.status === 'ACCEPTED' 
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : workerApplication.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                    }`}>
                      {workerApplication.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
              </motion.div>
        )}

        {/* Worker: Prominent Apply Now CTA */}
        {canApply && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 backdrop-blur-xl shadow-lg p-6 md:p-8"
              >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/20">
                    <Send className="w-6 h-6 text-primary" />
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
              </motion.div>
        )}

        {/* Worker: Apply/Bid form */}
        {canApply && (
              <motion.div
                id="apply-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden"
              >
              {/* Form Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5 px-6 md:px-8 py-6 border-b border-primary/20">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                  Submit Your Application
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell the customer why you&apos;re the perfect match for this chore.
                </p>
              </div>

                <form onSubmit={handleApply} className="p-6 md:p-8 space-y-6">
                {/* Message/Pitch Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Why are you a good fit? <span className="text-red-500">*</span>
                  </label>
                    <p className="text-xs text-muted-foreground mb-3">
                    Share your relevant experience and why you&apos;d be great for this job.
                  </p>
                    <Textarea
                    id="message"
                      rows={5}
                    required
                    minLength={10}
                    placeholder="I'm a great fit for this chore because..."
                      className="min-h-[120px] resize-none bg-background/50 border-border focus:border-primary focus:ring-primary/20"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {message.length > 0 && message.length < 10 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
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
                      Your Expected Amount (₹)
                  </label>
                    <p className="text-xs text-muted-foreground mb-3">
                    {chore.budget 
                        ? `The customer's budget is ₹${chore.budget.toLocaleString('en-IN')}. You can match it or propose a different amount.`
                      : 'No budget specified. Propose your rate for this job.'}
                  </p>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <Input
                      type="number"
                      id="bidAmount"
                      min="0"
                      step="1"
                      placeholder={chore.budget ? String(chore.budget) : 'Enter amount'}
                        className="pl-8 bg-background/50 border-border focus:border-primary focus:ring-primary/20"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                  <Button
                    type="submit"
                    disabled={submitting || message.length < 10}
                    variant="primary"
                    size="lg"
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-6 text-base shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <Send className="w-5 h-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                  </motion.div>
                  
                  <p className="text-center text-xs text-muted-foreground">
                    By applying, you agree to our terms and conditions
                  </p>
              </form>
              </motion.div>
        )}

        {/* Customer: Applications Panel */}
        {isOwner && applications && (
              <div className="w-full max-w-5xl mx-auto px-4 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
          <CustomerApplicationsPanel
            applications={applications}
            choreId={chore.id}
            choreStatus={choreStatus}
                    assignedWorkerId={chore.assignedWorkerId}
                    selectedApplicationId={selectedApplicationId}
                    onSelectApplication={setSelectedApplicationId}
                  />
                </motion.div>

                {/* Pre-assignment chat for customer */}
                {!chore.assignedWorkerId && selectedApplicationId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden"
                  >
                    <div className="h-[500px]">
                      <ChatPanel
                        mode="pre-assignment"
                        choreId={chore.id}
                        currentUserId={currentUser.id}
                        choreTitle={chore.title}
                        otherPartyName={
                          applications.find((app) => app.id === selectedApplicationId)?.worker
                            .name || 'Worker'
                        }
                        isOpen={true}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Prompt to select application for chat */}
                {!chore.assignedWorkerId &&
                  !selectedApplicationId &&
                  applications.length > 0 &&
                  applications.some((app) => app.status === 'PENDING') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
                    >
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MessageSquare className="w-5 h-5" />
                        <p className="text-sm">
                          Select an applicant to start a clarification chat.
                        </p>
                      </div>
                    </motion.div>
                  )}
              </div>
        )}

        {/* Customer: Cancellation Request Decision */}
        {isOwner &&
          choreStatus === 'CANCELLATION_REQUESTED' &&
          latestCancellationRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl shadow-lg p-6 md:p-8"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                Cancellation Requested
              </h2>
              <div className="space-y-4">
                <div>
                      <p className="text-sm text-foreground mb-2">
                    <span className="font-medium">Worker:</span>{' '}
                    {latestCancellationRequest.requestedBy?.name || 'Unknown'}
                  </p>
                  {latestCancellationRequest.reason ? (
                        <p className="text-sm text-foreground">
                      <span className="font-medium">Reason:</span>{' '}
                      {latestCancellationRequest.reason}
                    </p>
                  ) : (
                        <p className="text-sm text-muted-foreground">
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
                </motion.div>
        )}

        {/* Worker: Request Cancellation */}
        {isAssignedWorker &&
          (choreStatus === 'ASSIGNED' || choreStatus === 'IN_PROGRESS') &&
          !latestCancellationRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6 md:p-8"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                Request Cancellation
              </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
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
                </motion.div>
          )}

        {/* Worker: Cancellation Requested Status */}
        {isAssignedWorker &&
          choreStatus === 'CANCELLATION_REQUESTED' &&
          latestCancellationRequest &&
          latestCancellationRequest.requestedById === currentUser?.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl shadow-lg p-6"
                >
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                Cancellation Requested
              </h2>
                  <p className="text-sm text-foreground">
                You have requested cancellation. Waiting for customer&apos;s decision.
              </p>
                </motion.div>
          )}

        {/* Rating for this chore - Read-only card visible to all users */}
        {choreRating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6 md:p-8"
              >
                <h2 className="mb-4 text-xl font-semibold text-foreground">
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
                    <span className="ml-2 text-sm font-medium text-foreground">
                    {choreRating.score}/5
                  </span>
                </div>
                {choreRating.comment && (
                    <p className="text-sm text-muted-foreground">{choreRating.comment}</p>
                )}
                  <p className="text-xs text-muted-foreground">
                  By {choreRating.fromUser.name}
                </p>
              </div>
              </motion.div>
        )}

            {/* Rating Form - Only for owner after COMPLETED */}
        {currentUser &&
          isOwner &&
          choreStatus === 'COMPLETED' &&
          !hasRated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6 md:p-8"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground">
                Rate Worker
              </h2>
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
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
                        <span className="ml-2 text-sm text-muted-foreground">
                        ({ratingScore}/5)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="ratingComment"
                        className="block text-sm font-medium text-foreground"
                    >
                      Comment (optional)
                    </label>
                      <Textarea
                      id="ratingComment"
                      rows={4}
                        className="mt-1 bg-background/50 border-border focus:border-primary focus:ring-primary/20"
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
                </motion.div>
          )}

            {/* Rating info message - show when COMPLETED but user is not owner */}
        {choreStatus === 'COMPLETED' &&
          currentUser &&
          !isOwner && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
                >
                  <h2 className="mb-2 text-xl font-semibold text-foreground">Rating</h2>
                  <p className="text-sm text-muted-foreground">
                Only the customer can rate this chore.
              </p>
                </motion.div>
              )}

            {/* Payout Status Card - Show for completed chores with assigned worker */}
            {/* TODO: Re-enable payout status card when Razorpay payouts integration is complete. */}
            {/* Temporarily disabled - entire payout status card section commented out */}
            {/*
            {choreStatus === 'COMPLETED' && chore.assignedWorkerId && (() => {
              const latestPayout = (chore.workerPayouts && Array.isArray(chore.workerPayouts) && chore.workerPayouts.length > 0)
                ? chore.workerPayouts[0]
                : null

              const payoutAmount = latestPayout?.amount ? latestPayout.amount / 100 : null

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
                >
                  <h2 className="mb-4 text-xl font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Worker Payout Status
                  </h2>

                  {!latestPayout ? (
                    <p className="text-sm text-muted-foreground">
                      Payout not initiated yet
                    </p>
                  ) : latestPayout.status === 'PENDING' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Payout processing via Razorpay...</span>
                      </div>
                      {payoutAmount && (
                        <p className="text-xs text-muted-foreground">
                          Amount: ₹{payoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  ) : latestPayout.status === 'SUCCESS' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Payout of ₹{payoutAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'} sent to worker
                        </span>
                      </div>
                      {latestPayout.razorpayPayoutId && (
                        <p className="text-xs text-muted-foreground">
                          Razorpay ID: {latestPayout.razorpayPayoutId}
                        </p>
                      )}
                    </div>
                  ) : latestPayout.status === 'FAILED' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Payout failed</span>
                      </div>
                      {latestPayout.errorMessage && (
                        <p className="text-xs text-muted-foreground">
                          Error: {latestPayout.errorMessage}
                        </p>
                      )}
                      {(isOwner || currentUser?.role === 'ADMIN') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/payouts/retry', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ payoutId: latestPayout.id }),
                              })

                              const data = await response.json()

                              if (response.ok) {
                                toast.success('Payout retry initiated', 'Please check back in a few moments.')
                                router.refresh()
                              } else {
                                toast.error('Payout retry failed', data.error || 'Failed to retry payout. Please try again later.')
                              }
                            } catch (error) {
                              toast.error('Error', 'An error occurred while retrying the payout.')
                            }
                          }}
                          className="mt-2"
                        >
                          Retry payout
                        </Button>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )
            })()}
            */}

            {/* New ChatPanel Integration */}
            {/* Pre-assignment mode: Worker has applied but not assigned */}
            {isNotOwner && hasApplied && !chore.assignedWorkerId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden"
              >
                  <div className="h-[500px]">
                    <ChatPanel
                      mode="pre-assignment"
                      choreId={chore.id}
                      currentUserId={currentUser.id}
                      choreTitle={chore.title}
                      otherPartyName={chore.createdBy?.name || 'Customer'}
                      isOpen={true}
                      />
                    </div>
              </motion.div>
            )}

            {/* Post-assignment mode: Worker assigned, chat available */}
            {(() => {
              // Chat is enabled when worker is assigned and status is not terminal
              const hasWorker = !!chore.assignedWorkerId;
              const isTerminalStatus = [
                'CLOSED',
                'CANCELED',
                'CANCELLED',
              ].includes(choreStatus);
              const isChatEnabled = hasWorker && !isTerminalStatus;

              return currentUser &&
                (isOwner || isAssignedWorker) &&
                isChatEnabled ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden"
                >
                  <div className="h-[500px]">
                    <ChatPanel
                      mode="post-assignment"
                      choreId={chore.id}
                      currentUserId={currentUser.id}
                      choreTitle={chore.title}
                      otherPartyName={
                        isOwner
                          ? chore.assignedWorker?.name || 'Worker'
                          : chore.createdBy?.name || 'Customer'
                      }
                      isOpen={true}
                    />
                </div>
                </motion.div>
              ) : null;
            })()}

        {/* Chat unavailable message - show when user is owner/assigned worker but chat not available yet */}
            {(() => {
              const hasWorker = !!chore.assignedWorkerId;
              const isTerminalStatus = [
                'CLOSED',
                'CANCELED',
                'CANCELLED',
              ].includes(choreStatus);
              const isChatEnabled = hasWorker && !isTerminalStatus;

              return currentUser &&
          (isOwner || isAssignedWorker) &&
                !isChatEnabled ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg p-6"
                >
                  <h2 className="mb-2 text-xl font-semibold text-foreground">Chat</h2>
                  <p className="text-sm text-muted-foreground">
                Chat becomes available once the chore has been assigned to a worker.
              </p>
                </motion.div>
              ) : null;
            })()}
      </div>
        </div>
      </main>
    </div>
  )
}