'use client'

import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface ApplicationsListProps {
  applications: any[]
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">My Applications</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View all the chores you've applied for
          </p>
        </div>

        {applications.length === 0 ? (
          <Card className="text-center">
            <div className="py-12">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't applied for any chores yet.</p>
              <Link href="/chores">
                <Button variant="primary">Browse Chores</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="transition-shadow transition-transform hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/chores/${app.chore.id}`}
                      className="text-xl font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {app.chore.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                      {app.chore.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === 'ACCEPTED'
                        ? 'statusCompleted'
                        : app.status === 'REJECTED'
                        ? 'statusCancelled'
                        : 'statusPublished'
                    }
                  >
                    {app.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Posted by:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-50">{app.chore.createdBy.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Type:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-50">{app.chore.type}</span>
                  </div>
                  {app.chore.budget && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Budget:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-50">${app.chore.budget}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Applied:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-50">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                  {app.bidAmount && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Bid:</span>
                      <span className="ml-2 text-sm text-slate-900 dark:text-slate-50">${app.bidAmount}</span>
                    </div>
                  )}

                  {app.message && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{app.message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                    <span
                      className={`text-sm font-medium ${
                        app.chore.status === 'ASSIGNED' || app.chore.status === 'IN_PROGRESS'
                          ? 'text-blue-600 dark:text-blue-400'
                          : app.chore.status === 'COMPLETED'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Chore Status: {app.chore.status.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/chores/${app.chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

