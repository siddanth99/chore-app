/**
 * Dashboard Client V2 - Modern UI using Lovable components
 * 
 * This component uses the new Lovable UI components while maintaining
 * the same props interface as dashboard-client.tsx for easy switching.
 * 
 * DATA SHAPE (from server/api/dashboard.ts):
 * 
 * WorkerDashboardData:
 * {
 *   stats: {
 *     averageRating: number
 *     ratingCount: number
 *     totalCompleted: number
 *     totalEarnings: number
 *     completedLast30Days: number
 *   }
 *   assignedChores: Chore[]
 *   inProgressChores: Chore[]
 *   completedChores: Chore[]
 *   cancelledChores: Chore[]
 *   paymentDashboard: WorkerPaymentDashboard
 * }
 * 
 * CustomerDashboardData:
 * {
 *   stats: {
 *     totalPosted: number
 *     totalCompleted: number
 *     totalSpent: number
 *     ratingsGiven: number
 *   }
 *   draftChores: Chore[]
 *   publishedChores: Chore[]
 *   activeChores: Chore[]
 *   completedChores: Chore[]
 *   cancelledChores: Chore[]
 *   paymentDashboard: CustomerPaymentDashboard
 * }
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WorkerDashboardData, CustomerDashboardData } from '@/server/api/dashboard'

// New Lovable UI Components
import { StatCard } from '@/components/dashboard/StatCard'
import { SectionHeader } from '@/components/dashboard/SectionHeader'
import { AssignedCard } from '@/components/dashboard/AssignedCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { NotificationsSummary } from '@/components/dashboard/NotificationsSummary'
import { LovableDashboardChoreCard } from '@/components/dashboard/LovableDashboardChoreCard'

// Shared UI components
import LogoutButton from './logout-button'
import { Button } from '@/components/ui/button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Props Interface (matches dashboard-client.tsx for easy switching)
// -----------------------------------------------------------------------------
interface DashboardClientV2Props {
  user: any
  role: 'WORKER' | 'CUSTOMER'
  data: WorkerDashboardData | CustomerDashboardData
}

// -----------------------------------------------------------------------------
// Helper: Map chore status from Prisma to Lovable component status
// -----------------------------------------------------------------------------
function mapChoreStatus(status: string): 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' {
  switch (status) {
    case 'DRAFT': return 'draft'
    case 'PUBLISHED': return 'open'
    case 'ASSIGNED': return 'in_progress'
    case 'IN_PROGRESS': return 'in_progress'
    case 'COMPLETED': return 'completed'
    case 'CANCELLED': return 'cancelled'
    case 'CANCELLATION_REQUESTED': return 'in_progress'
    default: return 'draft'
  }
}

// -----------------------------------------------------------------------------
// Helper: Format relative time
// -----------------------------------------------------------------------------
function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
}

// -----------------------------------------------------------------------------
// Icon Components (inline SVGs for stat cards)
// -----------------------------------------------------------------------------
const Icons = {
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  ),
  dollar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  calendar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  document: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  ),
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function DashboardClientV2({ user, role, data }: DashboardClientV2Props) {
  const router = useRouter()
  const [reportFrom, setReportFrom] = useState<string>('')
  const [reportTo, setReportTo] = useState<string>('')

  const handleDownloadCSV = () => {
    const params = new URLSearchParams()
    params.set('format', 'csv')
    if (reportFrom) params.set('from', reportFrom)
    if (reportTo) params.set('to', reportTo)
    window.location.href = `/api/payments/report?${params.toString()}`
  }

  // TODO: Fetch notifications from API or pass via props
  // For now, using placeholder data
  const mockNotifications = [
    { id: '1', title: 'System Update', message: 'New features available', time: 'Just now', type: 'system' as const },
  ]

  // -------------------------------------------------------------------------
  // WORKER Dashboard
  // -------------------------------------------------------------------------
  if (role === 'WORKER') {
    const workerData = data as WorkerDashboardData
    const { stats, assignedChores, inProgressChores, completedChores, cancelledChores } = workerData

    // Combine assigned + in-progress for "Active Jobs" section
    const activeJobs = [...assignedChores, ...inProgressChores]

    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section with Stats */}
        <section className="relative pt-8 pb-8 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Welcome back, {user?.name?.split(' ')[0] || 'Worker'}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's your worker dashboard overview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                  Worker
                </span>
                <LogoutButton />
              </div>
            </div>

            {/* Stats Grid - Maps workerData.stats → StatCard components */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                icon={Icons.star}
                variant="highlight"
                trend={stats.ratingCount > 0 ? { value: stats.ratingCount, isPositive: true } : undefined}
              />
              <StatCard
                title="Total Completed"
                value={stats.totalCompleted}
                icon={Icons.check}
                variant="primary"
              />
              <StatCard
                title="Total Earnings"
                value={`$${stats.totalEarnings.toLocaleString()}`}
                icon={Icons.dollar}
                variant="accent"
              />
              <StatCard
                title="Last 30 Days"
                value={stats.completedLast30Days}
                icon={Icons.calendar}
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
          {/* Quick Actions */}
          <section>
            <SectionHeader
              title="Quick Actions"
              subtitle="Get things done faster"
            />
            <QuickActions isWorker={true} />
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Active Jobs (Assigned + In Progress) */}
              <section>
                <SectionHeader
                  title="Active Jobs"
                  subtitle="Tasks assigned to you"
                  action={
                    <Button variant="outline" onClick={() => router.push('/chores')}>
                      Find More Jobs
                    </Button>
                  }
                />
                {activeJobs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeJobs.slice(0, 4).map((chore) => (
                      <AssignedCard
                        key={chore.id}
                        title={chore.title}
                        category={chore.category || 'General'}
                        assignedBy={chore.createdBy?.name || 'Customer'}
                        progress={chore.status === 'IN_PROGRESS' ? 50 : 25}
                        dueDate={chore.dueAt ? formatRelativeTime(chore.dueAt) : 'No deadline'}
                        budget={`$${chore.budget || 0}`}
                        isWorkerView={true}
                        onChat={() => router.push(`/chores/${chore.id}`)}
                        onMarkComplete={() => router.push(`/chores/${chore.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
                    <p className="text-muted-foreground">No active jobs. Browse available chores!</p>
                    <Button className="mt-4" onClick={() => router.push('/chores')}>
                      Browse Chores
                    </Button>
                  </div>
                )}
              </section>

              {/* Completed Chores */}
              <section>
                <SectionHeader
                  title="Completed Chores"
                  subtitle={`${completedChores.length} jobs completed`}
                />
                {completedChores.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedChores.slice(0, 4).map((chore) => (
                      <LovableDashboardChoreCard
                        key={chore.id}
                        title={chore.title}
                        category={chore.category || 'General'}
                        status="completed"
                        applicationsCount={chore._count?.applications || 0}
                        budget={`$${chore.budget || 0}`}
                        createdAt={formatRelativeTime(chore.createdAt)}
                        onView={() => router.push(`/chores/${chore.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
                    <p className="text-muted-foreground">No completed chores yet.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Notifications */}
              <NotificationsSummary
                unreadCount={0}
                recentNotifications={mockNotifications}
                onViewAll={() => router.push('/notifications')}
              />

              {/* Earnings Summary Card */}
              {workerData.paymentDashboard && (
                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 p-5 backdrop-blur-sm">
                  <h3 className="font-semibold text-foreground mb-4">Earnings Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">All Time</span>
                      <span className="font-semibold text-foreground">
                        ${workerData.paymentDashboard.totalEarnedAllTime.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last 30 Days</span>
                      <span className="font-semibold text-foreground">
                        ${workerData.paymentDashboard.totalEarnedLast30Days.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unsettled</span>
                      <span className="font-semibold text-foreground">
                        {workerData.paymentDashboard.unsettledCompletedChores.length} chores
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Card */}
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-highlight/5 to-accent/5 p-5 backdrop-blur-sm">
                <h3 className="font-semibold text-foreground mb-4">Your Rating</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-highlight">{stats.averageRating.toFixed(1)}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={star <= Math.round(stats.averageRating) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        className={star <= Math.round(stats.averageRating) ? 'text-highlight' : 'text-muted-foreground'}
                      >
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {stats.ratingCount} review{stats.ratingCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Export Section */}
          {workerData.paymentDashboard && (
            <section>
              <SectionHeader
                title="Export Earnings"
                subtitle="Download your earnings report"
              />
              <Card className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">From Date</label>
                    <input
                      type="date"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">To Date</label>
                    <input
                      type="date"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="secondary" size="sm" onClick={handleDownloadCSV} className="w-full">
                      Download CSV
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // CUSTOMER Dashboard
  // -------------------------------------------------------------------------
  const customerData = data as CustomerDashboardData
  const { stats, draftChores, publishedChores, activeChores, completedChores, cancelledChores } = customerData

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Stats */}
      <section className="relative pt-8 pb-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Welcome back, {user?.name?.split(' ')[0] || 'Customer'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your chores today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                Customer
              </span>
              <LogoutButton />
            </div>
          </div>

          {/* Stats Grid - Maps customerData.stats → StatCard components */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Posted Chores"
              value={stats.totalPosted}
              icon={Icons.document}
              variant="primary"
            />
            <StatCard
              title="Completed"
              value={stats.totalCompleted}
              icon={Icons.check}
              variant="accent"
            />
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent.toLocaleString()}`}
              icon={Icons.dollar}
              variant="highlight"
            />
            <StatCard
              title="Ratings Given"
              value={stats.ratingsGiven}
              icon={Icons.star}
              variant="default"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
        {/* Quick Actions */}
        <section>
          <SectionHeader
            title="Quick Actions"
            subtitle="Get things done faster"
          />
          <QuickActions isWorker={false} />
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* My Posted Chores (Published) */}
            <section>
              <SectionHeader
                title="My Posted Chores"
                subtitle="Manage your posted tasks"
                action={
                  <Button onClick={() => router.push('/chores/new')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                    Post New
                  </Button>
                }
              />
              {publishedChores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {publishedChores.slice(0, 4).map((chore) => (
                    <LovableDashboardChoreCard
                      key={chore.id}
                      title={chore.title}
                      category={chore.category || 'General'}
                      status="open"
                      applicationsCount={chore._count?.applications || 0}
                      budget={`$${chore.budget || 0}`}
                      createdAt={formatRelativeTime(chore.createdAt)}
                      onView={() => router.push(`/chores/${chore.id}`)}
                      onEdit={() => router.push(`/chores/${chore.id}/edit`)}
                      onManage={() => router.push(`/chores/${chore.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
                  <p className="text-muted-foreground mb-4">No published chores yet.</p>
                  <Button onClick={() => router.push('/chores/new')}>
                    Post Your First Chore
                  </Button>
                </div>
              )}
            </section>

            {/* Active Chores (Assigned / In Progress) */}
            <section>
              <SectionHeader
                title="Active Chores"
                subtitle="Tasks currently in progress"
              />
              {activeChores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeChores.slice(0, 4).map((chore) => (
                    <AssignedCard
                      key={chore.id}
                      title={chore.title}
                      category={chore.category || 'General'}
                      assignedTo={chore.assignedWorker?.name || 'Pending'}
                      progress={chore.status === 'IN_PROGRESS' ? 50 : 25}
                      dueDate={chore.dueAt ? formatRelativeTime(chore.dueAt) : 'No deadline'}
                      budget={`$${chore.budget || 0}`}
                      isWorkerView={false}
                      onChat={() => router.push(`/chores/${chore.id}`)}
                      onManage={() => router.push(`/chores/${chore.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
                  <p className="text-muted-foreground">No active chores.</p>
                </div>
              )}
            </section>

            {/* Drafts */}
            {draftChores.length > 0 && (
              <section>
                <SectionHeader
                  title="Drafts"
                  subtitle="Unpublished chores"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {draftChores.slice(0, 4).map((chore) => (
                    <LovableDashboardChoreCard
                      key={chore.id}
                      title={chore.title}
                      category={chore.category || 'General'}
                      status="draft"
                      applicationsCount={0}
                      budget={`$${chore.budget || 0}`}
                      createdAt={formatRelativeTime(chore.createdAt)}
                      onView={() => router.push(`/chores/${chore.id}`)}
                      onEdit={() => router.push(`/chores/${chore.id}/edit`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <NotificationsSummary
              unreadCount={0}
              recentNotifications={mockNotifications}
              onViewAll={() => router.push('/notifications')}
            />

            {/* Spending Summary Card */}
            {customerData.paymentDashboard && (
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 p-5 backdrop-blur-sm">
                <h3 className="font-semibold text-foreground mb-4">Spending Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">All Time</span>
                    <span className="font-semibold text-foreground">
                      ${customerData.paymentDashboard.totalPaidAllTime.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last 30 Days</span>
                    <span className="font-semibold text-foreground">
                      ${customerData.paymentDashboard.totalPaidLast30Days.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unsettled</span>
                    <span className="font-semibold text-foreground">
                      {customerData.paymentDashboard.unsettledCompletedChores.length} chores
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-highlight/5 to-accent/5 p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Chores</span>
                  <span className="font-semibold text-foreground">{activeChores.length}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.min((stats.totalCompleted / Math.max(stats.totalPosted, 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalPosted > 0 ? Math.round((stats.totalCompleted / stats.totalPosted) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Chores Section */}
        {completedChores.length > 0 && (
          <section>
            <SectionHeader
              title="Completed Chores"
              subtitle={`${completedChores.length} tasks completed`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedChores.slice(0, 6).map((chore) => (
                <LovableDashboardChoreCard
                  key={chore.id}
                  title={chore.title}
                  category={chore.category || 'General'}
                  status="completed"
                  applicationsCount={chore._count?.applications || 0}
                  budget={`$${chore.budget || 0}`}
                  createdAt={formatRelativeTime(chore.updatedAt || chore.createdAt)}
                  onView={() => router.push(`/chores/${chore.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Payment Export Section */}
        {customerData.paymentDashboard && (
          <section>
            <SectionHeader
              title="Export Payments"
              subtitle="Download your payment history"
            />
            <Card className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">From Date</label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">To Date</label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" size="sm" onClick={handleDownloadCSV} className="w-full">
                    Download CSV
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}

