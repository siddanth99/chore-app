'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ApplicationStatus } from '@prisma/client'
import { ApplicationCard } from '@/components/dashboard/ApplicationCard'
import Button from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  status: ApplicationStatus
  bidAmount: number | null
  message: string | null
  createdAt: string | Date
  chore: {
    id: string
    title: string
    category: string
    status: string
    budget: number | null
    createdAt: string | Date
  }
}

interface ApplicationsListProps {
  applications: Application[]
}

type TabKey = 'all' | 'pending' | 'accepted' | 'rejected'

const tabs: { key: TabKey; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'text-slate-600 dark:text-slate-400' },
  { key: 'pending', label: 'Pending', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'accepted', label: 'Accepted', color: 'text-green-600 dark:text-green-400' },
  { key: 'rejected', label: 'Rejected', color: 'text-red-600 dark:text-red-400' },
]

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  // Count applications by status
  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'PENDING').length,
      accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length,
    }
  }, [applications])

  // Filter applications by active tab
  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') return applications
    if (activeTab === 'pending') return applications.filter((a) => a.status === 'PENDING')
    if (activeTab === 'accepted') return applications.filter((a) => a.status === 'ACCEPTED')
    if (activeTab === 'rejected')
      return applications.filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN')
    return applications
  }, [applications, activeTab])

  // Map application status to ApplicationCard status
  const mapStatus = (status: ApplicationStatus): 'pending' | 'accepted' | 'rejected' => {
    switch (status) {
      case 'ACCEPTED':
        return 'accepted'
      case 'REJECTED':
      case 'WITHDRAWN':
        return 'rejected'
      default:
        return 'pending'
    }
  }

  // Empty state component
  const EmptyState = () => (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {activeTab === 'all'
          ? 'Start by browsing open chores and applying to ones that match your skills.'
          : `You don't have any ${activeTab} applications right now.`}
      </p>
      <Link href="/chores">
        <Button variant="primary" size="lg" className="shadow-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Find Work
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
              <p className="mt-1 text-muted-foreground">
                Track and manage your job applications
              </p>
            </div>
            <Link href="/chores">
              <Button variant="primary" className="shadow-md">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Find More Work
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-1 bg-secondary/50 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-background shadow-md text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications Grid or Empty State */}
        {filteredApplications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                choreTitle={app.chore.title}
                choreCategory={app.chore.category}
                bid={app.bidAmount ? `$${app.bidAmount}` : 'No bid'}
                status={mapStatus(app.status)}
                appliedAt={formatDate(app.createdAt)}
                onView={() => router.push(`/chores/${app.chore.id}?from=applications`)}
              />
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {applications.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">
                  {counts.pending} pending
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {counts.accepted} accepted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">
                  {counts.rejected} not selected
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
