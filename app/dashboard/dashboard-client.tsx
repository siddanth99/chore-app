'use client'

import Link from 'next/link'
import { WorkerDashboardData, CustomerDashboardData } from '@/server/api/dashboard'
import DashboardStatCard from '@/components/dashboard/DashboardStatCard'
import DashboardSection from '@/components/dashboard/DashboardSection'
import DashboardChoreCard from '@/components/dashboard/DashboardChoreCard'
import LogoutButton from './logout-button'
import Button from '@/components/ui/Button'

interface DashboardClientProps {
  user: any
  role: 'WORKER' | 'CUSTOMER'
  data: WorkerDashboardData | CustomerDashboardData
}

export default function DashboardClient({ user, role, data }: DashboardClientProps) {
  if (role === 'WORKER') {
    const workerData = data as WorkerDashboardData
    const { stats, assignedChores, inProgressChores, completedChores } = workerData

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
        </div>
      </div>
    )
  }

  // CUSTOMER Dashboard
  const customerData = data as CustomerDashboardData
  const { stats, draftChores, publishedChores, activeChores, completedChores } = customerData

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

        {/* Active Chores (Assigned / In Progress) */}
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
      </div>
    </div>
  )
}
