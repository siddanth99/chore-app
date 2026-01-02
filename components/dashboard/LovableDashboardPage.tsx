/**
 * REFERENCE FILE - Lovable Dashboard Page
 * 
 * This file is a reference implementation from the Lovable UI repo.
 * It shows the intended UI structure but uses dummy data.
 * 
 * To integrate: Adapt this UI to use real data from server/api/dashboard.ts
 * by creating a new dashboard-client.tsx that wires up the components.
 */
'use client';

import * as React from 'react';
import { useState } from 'react';
// Header is now global in layout.tsx, no need to import here
import {
  SectionHeader,
  StatCard,
  ApplicationCard,
  AssignedCard,
  QuickActions,
  NotificationsSummary,
} from '@/components/dashboard';
import { LovableDashboardChoreCard } from './LovableDashboardChoreCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// TODO: Replace with actual user data from backend
const DUMMY_STATS = {
  customer: {
    postedChores: 12,
    assignedChores: 3,
    completedChores: 8,
    applicationsCount: 45,
    spend: '$2,450',
  },
  worker: {
    applicationsCount: 24,
    assignedChores: 5,
    completedChores: 31,
    earnings: '$4,820',
  },
};

// TODO: Replace with actual chore data from backend
const DUMMY_POSTED_CHORES = [
  { id: '1', title: 'Deep Clean 3BR Apartment', category: 'Cleaning', status: 'open' as const, applicationsCount: 8, budget: '$150', createdAt: '2 days ago' },
  { id: '2', title: 'Fix Leaky Kitchen Faucet', category: 'Plumbing', status: 'in_progress' as const, applicationsCount: 3, budget: '$80', createdAt: '5 days ago' },
  { id: '3', title: 'Assemble IKEA Furniture', category: 'Handyman', status: 'completed' as const, applicationsCount: 12, budget: '$100', createdAt: '1 week ago' },
  { id: '4', title: 'Garden Maintenance', category: 'Gardening', status: 'open' as const, applicationsCount: 5, budget: '$200', createdAt: '1 day ago' },
];

// TODO: Replace with actual application data from backend
const DUMMY_APPLICATIONS = [
  { id: '1', choreTitle: 'Move 2BR Apartment', choreCategory: 'Moving', bid: '$250', status: 'pending' as const, appliedAt: '3 hours ago' },
  { id: '2', choreTitle: 'Paint Living Room', choreCategory: 'Painting', bid: '$180', status: 'accepted' as const, appliedAt: '1 day ago' },
  { id: '3', choreTitle: 'Install Smart Thermostat', choreCategory: 'Electrical', bid: '$75', status: 'rejected' as const, appliedAt: '2 days ago' },
];

// TODO: Replace with actual assigned data from backend
const DUMMY_ASSIGNED = [
  { id: '1', title: 'Weekly House Cleaning', category: 'Cleaning', assignedTo: 'Sarah M.', assignedBy: 'John D.', progress: 75, dueDate: 'Tomorrow', budget: '$120' },
  { id: '2', title: 'Lawn Mowing Service', category: 'Gardening', assignedTo: 'Mike R.', assignedBy: 'Emily S.', progress: 30, dueDate: 'In 3 days', budget: '$85' },
];

// TODO: Replace with actual notification data from backend
const DUMMY_NOTIFICATIONS = [
  { id: '1', title: 'New Application', message: 'Sarah M. applied to your "Deep Clean" chore', time: '5m ago', type: 'application' as const },
  { id: '2', title: 'Payment Received', message: 'You received $150 for "Fix Faucet"', time: '1h ago', type: 'payment' as const },
  { id: '3', title: 'New Message', message: 'John sent you a message about the task', time: '2h ago', type: 'message' as const },
];

export default function DashboardPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [userRole, setUserRole] = useState<'customer' | 'worker'>('customer');

  const handleToggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header is now rendered globally in layout.tsx */}

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your chores today.
              </p>
            </div>

            {/* Role Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border/50">
              <button
                onClick={() => setUserRole('customer')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  userRole === 'customer'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Customer
              </button>
              <button
                onClick={() => setUserRole('worker')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  userRole === 'worker'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Worker
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userRole === 'customer' ? (
              <>
                <StatCard
                  title="Posted Chores"
                  value={DUMMY_STATS.customer.postedChores}
                  variant="primary"
                  trend={{ value: 12, isPositive: true }}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <path d="M12 9v6M9 12h6" />
                    </svg>
                  }
                />
                <StatCard
                  title="In Progress"
                  value={DUMMY_STATS.customer.assignedChores}
                  variant="accent"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  }
                />
                <StatCard
                  title="Completed"
                  value={DUMMY_STATS.customer.completedChores}
                  variant="default"
                  trend={{ value: 8, isPositive: true }}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                  }
                />
                <StatCard
                  title="Total Spend"
                  value={DUMMY_STATS.customer.spend}
                  variant="highlight"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  }
                />
              </>
            ) : (
              <>
                <StatCard
                  title="Applications"
                  value={DUMMY_STATS.worker.applicationsCount}
                  variant="primary"
                  trend={{ value: 15, isPositive: true }}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                />
                <StatCard
                  title="Active Jobs"
                  value={DUMMY_STATS.worker.assignedChores}
                  variant="accent"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 9h6v6H9z" />
                    </svg>
                  }
                />
                <StatCard
                  title="Completed"
                  value={DUMMY_STATS.worker.completedChores}
                  variant="default"
                  trend={{ value: 22, isPositive: true }}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                  }
                />
                <StatCard
                  title="Total Earnings"
                  value={DUMMY_STATS.worker.earnings}
                  variant="highlight"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  }
                />
              </>
            )}
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
          <QuickActions isWorker={userRole === 'worker'} />
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Posted Chores (Customer) or Applications (Worker) */}
            {userRole === 'customer' ? (
              <section>
                <SectionHeader
                  title="My Posted Chores"
                  subtitle="Manage your posted tasks"
                  action={
                    <Button
                      onClick={() => {
                        // TODO: router.push('/chores/new')
                        console.log('Navigate to new chore');
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                      Post New
                    </Button>
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DUMMY_POSTED_CHORES.map((chore) => (
                    <LovableDashboardChoreCard
                      key={chore.id}
                      {...chore}
                      onView={() => {
                        // TODO: router.push(`/chores/${chore.id}`)
                        console.log('View chore', chore.id);
                      }}
                      onEdit={() => {
                        // TODO: router.push(`/chores/${chore.id}/edit`)
                        console.log('Edit chore', chore.id);
                      }}
                      onManage={() => {
                        // TODO: router.push(`/chores/${chore.id}/manage`)
                        console.log('Manage chore', chore.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section>
                <SectionHeader
                  title="My Applications"
                  subtitle="Track your job applications"
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: router.push('/browse')
                        console.log('Browse chores');
                      }}
                    >
                      Find More Jobs
                    </Button>
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DUMMY_APPLICATIONS.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      {...app}
                      onView={() => {
                        // TODO: router.push(`/applications/${app.id}`)
                        console.log('View application', app.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Assigned Tasks */}
            <section>
              <SectionHeader
                title={userRole === 'customer' ? 'Assigned Chores' : 'Assigned to Me'}
                subtitle={userRole === 'customer' ? 'Tasks currently in progress' : 'Your active jobs'}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DUMMY_ASSIGNED.map((task) => (
                  <AssignedCard
                    key={task.id}
                    {...task}
                    isWorkerView={userRole === 'worker'}
                    onChat={() => {
                      // TODO: Open chat
                      console.log('Open chat for task', task.id);
                    }}
                    onMarkComplete={() => {
                      // TODO: Mark complete
                      console.log('Mark complete', task.id);
                    }}
                    onManage={() => {
                      // TODO: router.push(`/tasks/${task.id}`)
                      console.log('Manage task', task.id);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <NotificationsSummary
              unreadCount={3}
              recentNotifications={DUMMY_NOTIFICATIONS}
              onViewAll={() => {
                // TODO: router.push('/notifications')
                console.log('View all notifications');
              }}
            />

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-foreground">92%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-primary to-accent" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Response</span>
                  <span className="font-semibold text-foreground">2.4 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-highlight">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="font-semibold text-foreground">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
