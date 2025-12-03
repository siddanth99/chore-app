// TODO: Legacy dashboard UI. Candidate for removal after v2 dashboard is fully verified in production.
// See dashboard-client-v2.tsx for the new Lovable UI implementation.
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WorkerDashboardData, CustomerDashboardData } from '@/server/api/dashboard'
import DashboardStatCard from '@/components/dashboard/DashboardStatCard'
import DashboardSection from '@/components/dashboard/DashboardSection'
import DashboardChoreCard from '@/components/dashboard/DashboardChoreCard'
import LogoutButton from './logout-button'
import Button from '@/components/ui/button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface DashboardClientProps {
  user: any
  role: 'WORKER' | 'CUSTOMER'
  data: WorkerDashboardData | CustomerDashboardData
}

export default function DashboardClient({ user, role, data }: DashboardClientProps) {
  // Report download state
  const [reportFrom, setReportFrom] = useState<string>('')
  const [reportTo, setReportTo] = useState<string>('')

  const handleDownloadCSV = () => {
    const params = new URLSearchParams()
    params.set('format', 'csv')
    if (reportFrom) params.set('from', reportFrom)
    if (reportTo) params.set('to', reportTo)
    const url = `/api/payments/report?${params.toString()}`
    window.location.href = url
  }

  if (role === 'WORKER') {
    const workerData = data as WorkerDashboardData
    const { stats, assignedChores, inProgressChores, completedChores, cancelledChores } = workerData

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Worker Overview</p>
            </div>
            <LogoutButton />
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <DashboardStatCard
              icon="⭐"
              label="Average Rating"
              value={stats.averageRating.toFixed(1)}
              subtitle={`${stats.ratingCount} review${stats.ratingCount !== 1 ? 's' : ''}`}
            />
            <DashboardStatCard
              icon="✅"
              label="Total Completed"
              value={stats.totalCompleted}
              subtitle="All time"
            />
            <DashboardStatCard
              icon="💰"
              label="Total Earnings"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              subtitle="All time"
            />
            <DashboardStatCard
              icon="📅"
              label="Completed (30 days)"
              value={stats.completedLast30Days}
              subtitle="Last month"
            />
          </div>

          {/* Assigned to You */}
          <DashboardSection
            title="Assigned to You"
            count={assignedChores.length}
            emptyMessage="No assigned chores yet."
          >
            {assignedChores.map((chore) => (
              <DashboardChoreCard key={chore.id} chore={chore} />
            ))}
          </DashboardSection>

          {/* In Progress */}
          <DashboardSection
            title="In Progress"
            count={inProgressChores.length}
            emptyMessage="No chores in progress."
          >
            {inProgressChores.map((chore) => (
              <DashboardChoreCard key={chore.id} chore={chore} />
            ))}
          </DashboardSection>

          {/* Completed Chores */}
          <DashboardSection
            title="Completed Chores"
            count={completedChores.length}
            emptyMessage="No completed chores yet."
          >
            {completedChores.map((chore) => (
              <DashboardChoreCard
                key={chore.id}
                chore={chore}
                showRating={true}
                showEarnings={true}
              />
            ))}
          </DashboardSection>

          {/* Cancelled Chores */}
          <DashboardSection
            title="Cancelled Chores"
            count={cancelledChores.length}
            emptyMessage="You don't have any cancelled chores yet."
          >
            {cancelledChores.map((chore) => (
              <DashboardChoreCard
                key={chore.id}
                chore={chore}
                showWorker={false}
                showRating={true}
                showEarnings={false}
                showRateButton={false}
              />
            ))}
          </DashboardSection>

          {/* Payment Dashboard - Worker */}
          {workerData.paymentDashboard && (
            <>
              {/* Earnings Summary */}
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Earnings Summary
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Earned (All Time)</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      ${workerData.paymentDashboard.totalEarnedAllTime.toLocaleString()}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Earned in Last 30 Days</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      ${workerData.paymentDashboard.totalEarnedLast30Days.toLocaleString()}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Completed, Not Fully Paid</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {workerData.paymentDashboard.unsettledCompletedChores.length}
                    </p>
                  </Card>
                </div>
              </div>

              {/* Export Earnings */}
              <Card className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Export Earnings
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadCSV}
                      className="w-full"
                    >
                      Download CSV
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recent Payments */}
              <Card className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Recent Payments
                </h3>
                {workerData.paymentDashboard.recentPayments.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No payments received yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Chore</th>
                          <th className="py-2 pr-4">From</th>
                          <th className="py-2 pr-4">Amount</th>
                          <th className="py-2 pr-4">Method</th>
                          <th className="py-2 pr-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {workerData.paymentDashboard.recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                              {formatDate(payment.createdAt)}
                            </td>
                            <td className="py-2 pr-4">
                              <Link
                                href={`/chores/${payment.chore.id}`}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {payment.chore.title}
                              </Link>
                            </td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                              {payment.fromUser.name || 'Unknown'}
                            </td>
                            <td className="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-50">
                              ${payment.amount}
                            </td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                              {payment.method.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                              {payment.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Completed, Not Fully Paid */}
              <Card className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Completed, Not Fully Paid
                </h3>
                {workerData.paymentDashboard.unsettledCompletedChores.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    All completed chores are fully settled.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {workerData.paymentDashboard.unsettledCompletedChores.map((chore) => (
                      <div
                        key={chore.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/chores/${chore.id}`}
                              className="font-medium text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {chore.title}
                            </Link>
                            <Badge
                              variant={
                                chore.paymentStatus === 'NONE'
                                  ? 'statusDraft'
                                  : chore.paymentStatus === 'CUSTOMER_PARTIAL'
                                  ? 'statusInProgress'
                                  : 'statusPublished'
                              }
                            >
                              {chore.paymentStatus.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Customer: {chore.createdBy.name || 'Unknown'} • Agreed Price:{' '}
                            {chore.agreedPrice != null ? `$${chore.agreedPrice}` : 'Not set'}
                          </div>
                        </div>
                        <Link href={`/chores/${chore.id}`}>
                          <Button variant="secondary" size="sm">
                            View Chore
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    )
  }

  // CUSTOMER Dashboard
  const customerData = data as CustomerDashboardData
  const { stats, draftChores, publishedChores, activeChores, completedChores, cancelledChores } = customerData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customer Overview</p>
          </div>
          <div className="flex gap-4">
            <Link href="/chores/new">
              <Button variant="primary" size="sm">
                Create New Chore
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <DashboardStatCard
            icon="🧹"
            label="Total Posted"
            value={stats.totalPosted}
            subtitle="All time"
          />
          <DashboardStatCard
            icon="✅"
            label="Total Completed"
            value={stats.totalCompleted}
            subtitle="All time"
          />
          <DashboardStatCard
            icon="💰"
            label="Total Spent"
            value={`$${stats.totalSpent.toLocaleString()}`}
            subtitle="All time"
          />
          <DashboardStatCard
            icon="⭐"
            label="Ratings Given"
            value={stats.ratingsGiven}
            subtitle="To workers"
          />
        </div>

        {/* Drafts */}
        <DashboardSection
          title="Drafts"
          count={draftChores.length}
          emptyMessage="No draft chores."
        >
          {draftChores.map((chore) => (
            <DashboardChoreCard key={chore.id} chore={chore} />
          ))}
        </DashboardSection>

        {/* Published */}
        <DashboardSection
          title="Published"
          count={publishedChores.length}
          emptyMessage="No published chores."
        >
          {publishedChores.map((chore) => (
            <DashboardChoreCard key={chore.id} chore={chore} />
          ))}
        </DashboardSection>

        {/* Active Chores (Assigned / In Progress / Cancellation Requested) */}
        <DashboardSection
          title="Active Chores"
          count={activeChores.length}
          emptyMessage="No active chores."
        >
          {activeChores.map((chore) => (
            <DashboardChoreCard key={chore.id} chore={chore} showWorker={true} />
          ))}
        </DashboardSection>

        {/* Completed Chores */}
        <DashboardSection
          title="Completed Chores"
          count={completedChores.length}
          emptyMessage="No completed chores yet."
        >
          {completedChores.map((chore) => (
            <DashboardChoreCard
              key={chore.id}
              chore={chore}
              showWorker={true}
              showRating={true}
              showRateButton={true}
            />
          ))}
        </DashboardSection>

        {/* Cancelled Chores */}
        <DashboardSection
          title="Cancelled Chores"
          count={cancelledChores.length}
          emptyMessage="You don't have any cancelled chores yet."
        >
          {cancelledChores.map((chore) => (
            <DashboardChoreCard
              key={chore.id}
              chore={chore}
              showWorker={true}
              showRating={true}
              showEarnings={false}
              showRateButton={false}
            />
          ))}
        </DashboardSection>

        {/* Payment Dashboard - Customer */}
        {customerData.paymentDashboard && (
          <>
            {/* Spending Summary */}
            <div className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Spending Summary
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid (All Time)</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    ${customerData.paymentDashboard.totalPaidAllTime.toLocaleString()}
                  </p>
                </Card>
                <Card>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Paid in Last 30 Days</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    ${customerData.paymentDashboard.totalPaidLast30Days.toLocaleString()}
                  </p>
                </Card>
                <Card>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Unsettled Completed Chores</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {customerData.paymentDashboard.unsettledCompletedChores.length}
                  </p>
                </Card>
              </div>
            </div>

            {/* Export Payments */}
            <Card className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Export Payments
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadCSV}
                    className="w-full"
                  >
                    Download CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Payments */}
            <Card className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Recent Payments
              </h3>
              {customerData.paymentDashboard.recentPayments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Chore</th>
                        <th className="py-2 pr-4">To</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Method</th>
                        <th className="py-2 pr-4">Direction</th>
                        <th className="py-2 pr-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerData.paymentDashboard.recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="py-2 pr-4">
                            <Link
                              href={`/chores/${payment.chore.id}`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {payment.chore.title}
                            </Link>
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {payment.toUser.name || 'Unknown'}
                          </td>
                          <td className="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-50">
                            ${payment.amount}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                            {payment.method.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant={
                                payment.direction === 'CUSTOMER_TO_OWNER'
                                  ? 'statusPublished'
                                  : 'statusCompleted'
                              }
                            >
                              {payment.direction === 'CUSTOMER_TO_OWNER' ? 'To Owner' : 'To Worker'}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                            {payment.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Unsettled Completed Chores */}
            <Card className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Completed but Not Fully Settled
              </h3>
              {customerData.paymentDashboard.unsettledCompletedChores.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All completed chores are fully settled.
                </p>
              ) : (
                <div className="space-y-3">
                  {customerData.paymentDashboard.unsettledCompletedChores.map((chore) => (
                    <div
                      key={chore.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/chores/${chore.id}`}
                            className="font-medium text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {chore.title}
                          </Link>
                          <Badge
                            variant={
                              chore.paymentStatus === 'NONE'
                                ? 'statusDraft'
                                : chore.paymentStatus === 'CUSTOMER_PARTIAL'
                                ? 'statusInProgress'
                                : 'statusPublished'
                            }
                          >
                            {chore.paymentStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Worker: {chore.assignedWorker?.name || 'N/A'} • Agreed Price:{' '}
                          {chore.agreedPrice != null ? `$${chore.agreedPrice}` : 'Not set'}
                        </div>
                      </div>
                      <Link href={`/chores/${chore.id}`}>
                        <Button variant="secondary" size="sm">
                          View Chore
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
