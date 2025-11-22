'use client'

import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-sm text-gray-600">
            View all the chores you've applied for
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-lg bg-white shadow p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't applied for any chores yet.</p>
            <Link
              href="/chores"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Browse Chores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg bg-white shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/chores/${app.chore.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {app.chore.title}
                      </Link>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {app.chore.description}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Posted by:</span>
                      <span className="ml-2 text-gray-900">{app.chore.createdBy.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 text-gray-900">{app.chore.type}</span>
                    </div>
                    {app.chore.budget && (
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <span className="ml-2 text-gray-900">${app.chore.budget}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Applied:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {app.bidAmount && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Bid:</span>
                      <span className="ml-2 text-sm text-gray-900">${app.bidAmount}</span>
                    </div>
                  )}

                  {app.message && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{app.message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span
                      className={`text-sm font-medium ${
                        app.chore.status === 'ASSIGNED' || app.chore.status === 'IN_PROGRESS'
                          ? 'text-blue-600'
                          : app.chore.status === 'COMPLETED'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      Chore Status: {app.chore.status.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/chores/${app.chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

