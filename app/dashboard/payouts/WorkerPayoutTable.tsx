'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PaymentStatus, type RazorpayPayment, type Chore } from '@prisma/client'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatCurrency'

// Extended type to include payout fields that may not be in Prisma types yet
type WorkerPayoutPayment = RazorpayPayment & {
  workerPayout?: number | null
  platformFee?: number | null
  transferId?: string | null
  chore: (Pick<Chore, 'id' | 'title' | 'budget' | 'status' | 'createdAt'>) | null
}

type Summary = {
  totalEarnings: number
  monthEarnings: number
  upiId: string
  isMockMode: boolean
}

type Props = {
  payments: WorkerPayoutPayment[]
  summary: Summary
}

type StatusFilter = 'ALL' | PaymentStatus
type DateRange = 'all' | 'this-month' | 'last-month' | 'last-90-days'

// Helper to format date (dd MMM yyyy format)
function formatDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) {
      return 'Invalid date'
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return 'Invalid date'
  }
}

// Helper to get status badge
function getStatusBadge(status: PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
          On Hold
        </span>
      )
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
          Released
        </span>
      )
    case 'REFUNDED':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
          Refunded
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
          Failed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
          {status}
        </span>
      )
  }
}

export default function WorkerPayoutTable({ payments, summary }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [choreSearch, setChoreSearch] = useState('')

  // Calculate date range boundaries
  const getDateRangeBoundaries = (range: DateRange): { start: Date | null; end: Date | null } => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (range) {
      case 'this-month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: null,
        }
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: lastMonth,
          end: lastMonthEnd,
        }
      case 'last-90-days':
        const ninetyDaysAgo = new Date(startOfToday)
        ninetyDaysAgo.setDate(startOfToday.getDate() - 90)
        return {
          start: ninetyDaysAgo,
          end: null,
        }
      case 'all':
      default:
        return { start: null, end: null }
    }
  }

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = payments

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Date range filter
    const { start, end } = getDateRangeBoundaries(dateRange)
    if (start) {
      filtered = filtered.filter((p) => p.createdAt >= start && (!end || p.createdAt <= end))
    }

    // Chore search filter
    if (choreSearch.trim()) {
      const searchLower = choreSearch.toLowerCase().trim()
      filtered = filtered.filter((p) =>
        p.chore?.title.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [payments, statusFilter, dateRange, choreSearch])

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Earnings This Month</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                ₹{summary.monthEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Lifetime Earnings</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                ₹{summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Payout Method</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                {summary.upiId}
              </p>
            </div>
          </div>

          {/* Mock Mode Indicator */}
          {summary.isMockMode && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Test Mode</strong> — Payouts are simulated. No real money is transferred.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Filters Section */}
      <Card>
        <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="status-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">On Hold</option>
              <option value="SUCCESS">Released</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="date-range-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date Range
            </label>
            <select
              id="date-range-filter"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-90-days">Last 90 Days</option>
            </select>
          </div>

          {/* Chore Search */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="chore-search" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search Chore
            </label>
            <input
              id="chore-search"
              type="text"
              placeholder="Search by chore title..."
              value={choreSearch}
              onChange={(e) => setChoreSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'payout' : 'payouts'}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Chore
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Transfer ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Release Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredPayments.map((payment) => {
                  const meta = (payment.meta as Record<string, any>) || {}
                  const releaseDate = meta.releaseAt || meta.mockReleaseAt

                  return (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                        {payment.chore ? (
                          <Link
                            href={`/chores/${payment.chore.id}`}
                            className="text-primary hover:underline"
                          >
                            {payment.chore.title}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {payment.workerPayout != null ? formatCurrency(payment.workerPayout) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {payment.platformFee != null ? formatCurrency(payment.platformFee) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {payment.transferId ? (
                          <span className="text-xs">{payment.transferId.substring(0, 10)}...</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {releaseDate ? formatDate(releaseDate) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                No payouts yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Once you complete a chore and the client approves it, payouts will appear here.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

