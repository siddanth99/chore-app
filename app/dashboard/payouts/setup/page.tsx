'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function PayoutSetupPage() {
  const router = useRouter()
  const toast = useToast()
  const [upiId, setUpiId] = useState('')
  const [payoutsEnabled, setPayoutsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/worker/payout-settings')
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setUpiId(data.upiId ?? '')
            setPayoutsEnabled(Boolean(data.payoutsEnabled))
          }
        }
      } catch (err) {
        console.error('Error loading payout settings:', err)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!upiId.trim()) {
      setError('Please enter your UPI ID')
      setLoading(false)
      return
    }

    // Basic UPI validation
    if (!upiId.includes('@')) {
      setError('Invalid UPI ID format. UPI ID should be in format: yourname@upi')
      setLoading(false)
      return
    }

    try {
      // First, save the payout settings (UPI ID and toggle)
      const settingsResponse = await fetch('/api/worker/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutUpiId: upiId.trim(),
          payoutsEnabled: true,
        }),
      })

      const settingsData = await settingsResponse.json()

      if (!settingsResponse.ok) {
        toast.error('Failed to save settings', settingsData.error || 'Please try again.')
        setError(settingsData.error || 'Failed to save payout settings')
        return
      }

      // Then, complete Razorpay onboarding if needed
      const response = await fetch('/api/payouts/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upiId: upiId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error === 'Payout onboarding already completed') {
          setSuccess(true)
          toast.success('Already onboarded', 'You have already enabled payouts.')
          setTimeout(() => {
            router.push('/dashboard/payouts')
          }, 2000)
          return
        }
        // Settings are saved, but onboarding failed - that's okay, settings persist
        toast.error('Onboarding incomplete', data.error || 'Settings saved, but Razorpay onboarding failed. Please try again.')
        setError(data.error || 'Razorpay onboarding failed')
        return
      }

      setSuccess(true)
      toast.success('Payouts enabled! 🎉', 'You can now receive payments for completed jobs.')
      setTimeout(() => {
        router.push('/dashboard/payouts')
      }, 2000)
    } catch (err) {
      toast.error('Error', 'Something went wrong. Please try again.')
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Payouts Enabled!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your payouts are now enabled. You can receive payments for completed jobs directly to your UPI ID.
            </p>
            <Button
              onClick={() => router.push('/dashboard/payouts')}
              variant="primary"
            >
              Go to Payouts
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Enable Payouts
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Complete payout onboarding to receive payments for completed jobs
          </p>
        </div>

        <Card>
          {loadingSettings ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Why enable payouts?
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You must complete payout onboarding before you can be assigned to jobs. Once enabled, payments will be
                      automatically transferred to your UPI ID when clients approve your completed work.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="upiId"
                className="block text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2"
              >
                UPI ID <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Enter your UPI ID (e.g., yourname@paytm, yourname@upi)
              </p>
              <input
                id="upiId"
                type="text"
                required
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Enable/Disable Payouts Toggle */}
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Enable Payouts
                  </span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Allow automatic payouts to your UPI ID when jobs are completed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutsEnabled(!payoutsEnabled)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${payoutsEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${payoutsEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !upiId.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Setting up...
                  </>
                ) : (
                  'Enable Payouts'
                )}
              </Button>
            </div>
              </form>
            </>
          )}
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payments are processed securely via Razorpay. Your UPI ID will be used for payouts only.
          </p>
        </div>
      </div>
    </div>
  )
}

