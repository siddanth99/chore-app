'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PaymentStatus } from '@prisma/client'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/utils'

type RazorpayPaymentWithChore = {
  id: string
  userId: string
  choreId: string | null
  amount: number // paise
  currency: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  razorpaySignature: string | null
  status: PaymentStatus
  notes: any
  meta: any
  createdAt: Date
  updatedAt: Date
  chore: {
    id: string
    title: string
    budget: number | null
  } | null
}

type Props = {
  initialPayments: RazorpayPaymentWithChore[]
}

type DateRange = 'all' | 'this-month' | 'last-month' | 'last-90-days'

export default function PaymentsTable({ initialPayments }: Props) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')
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
        return {
          start: new Date(startOfToday.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: null,
        }
      case 'all':
      default:
        return { start: null, end: null }
    }
  }

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = [...initialPayments]

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Date range filter
    if (dateRange !== 'all') {
      const { start, end } = getDateRangeBoundaries(dateRange)
      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.createdAt)
        if (start && paymentDate < start) return false
        if (end && paymentDate > end) return false
        return true
      })
    }

    // Chore search filter
    if (choreSearch.trim()) {
      const searchLower = choreSearch.toLowerCase().trim()
      filtered = filtered.filter((p) =>
        p.chore?.title.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [initialPayments, statusFilter, dateRange, choreSearch])

  // Get status badge variant
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            Success
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            Pending
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
            Failed
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Refunded
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
            {status}
          </span>
        )
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Filters */}
      <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Status Filter */}
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="status-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
            className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
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
            {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            {initialPayments.length === 0
              ? 'No payments found. Your payment history will appear here.'
              : 'No payments match your filters.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chore
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {payment.chore ? (
                      <Link
                        href={`/chores/${payment.chore.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        {payment.chore.title}
                      </Link>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 italic">No chore</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-400">
                    {payment.razorpayOrderId.slice(0, 12)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-400">
                    {payment.razorpayPaymentId ? (
                      <span title={payment.razorpayPaymentId}>
                        {payment.razorpayPaymentId.slice(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

