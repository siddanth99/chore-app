'use client'

import Link from 'next/link'
import LogoutButton from './logout-button'
import { ChoreStatus, ChoreType } from '@prisma/client'

interface DashboardClientProps {
  user: any
  chores?: any[]
  assignedChores?: any[]
  applications?: any[]
  nearbyChores?: any[]
  fallbackOfflineChores?: any[]
}

// Helper function to get status badge color
function getStatusBadgeColor(status: ChoreStatus) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800'
    case 'PUBLISHED':
      return 'bg-blue-100 text-blue-800'
    case 'ASSIGNED':
      return 'bg-orange-100 text-orange-800'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Helper function to get type badge color
function getTypeBadgeColor(type: ChoreType) {
  switch (type) {
    case 'ONLINE':
      return 'bg-indigo-100 text-indigo-800'
    case 'OFFLINE':
      return 'bg-teal-100 text-teal-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function DashboardClient({
  user,
  chores,
  assignedChores,
  applications,
  nearbyChores,
  fallbackOfflineChores = [],
}: DashboardClientProps) {
  // CUSTOMER Dashboard
  if (user.role === 'CUSTOMER' && chores) {
    // Group chores by status
    const choresByStatus = {
      DRAFT: chores.filter((c) => c.status === 'DRAFT'),
      PUBLISHED: chores.filter((c) => c.status === 'PUBLISHED'),
      ASSIGNED: chores.filter((c) => c.status === 'ASSIGNED'),
      IN_PROGRESS: chores.filter((c) => c.status === 'IN_PROGRESS'),
      COMPLETED: chores.filter((c) => c.status === 'COMPLETED'),
      CANCELLED: chores.filter((c) => c.status === 'CANCELLED'),
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">My Chores</h1>
            <div className="flex gap-4">
              <Link
                href="/chores/new"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Create New Chore
              </Link>
              <LogoutButton />
            </div>
          </div>

          {Object.entries(choresByStatus).map(([status, statusChores]) => {
            if (statusChores.length === 0) return null

            return (
              <div key={status} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {status.replace('_', ' ')} ({statusChores.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {statusChores.map((chore) => (
                    <div
                      key={chore.id}
                      className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {chore.title}
                        </h3>
                        <div className="flex gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                              chore.type
                            )}`}
                          >
                            {chore.type}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                            chore.status
                          )}`}
                        >
                          {chore.status.replace('_', ' ')}
                        </span>
                      </div>
                      {chore.status === 'PUBLISHED' && (
                        <p className="text-sm text-gray-600 mb-3">
                          {chore._count.applications} application
                          {chore._count.applications !== 1 ? 's' : ''}
                        </p>
                      )}
                      {chore.assignedWorker && (
                        <p className="text-sm text-gray-600 mb-3">
                          Assigned to: {chore.assignedWorker.name}
                        </p>
                      )}
                      <Link
                        href={`/chores/${chore.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {chores.length === 0 && (
            <div className="rounded-lg bg-white shadow p-12 text-center">
              <p className="text-gray-500 mb-4">You haven't created any chores yet.</p>
              <Link
                href="/chores/new"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Create Your First Chore
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // WORKER Dashboard
  if (user.role === 'WORKER') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
            <LogoutButton />
          </div>

          {/* Assigned to Me */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assigned to Me ({assignedChores?.length || 0})
            </h2>
            {assignedChores && assignedChores.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedChores.map((chore) => (
                  <div
                    key={chore.id}
                    className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {chore.title}
                      </h3>
                      <div className="flex gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                            chore.type
                          )}`}
                        >
                          {chore.type}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                          chore.status
                        )}`}
                      >
                        {chore.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Customer: {chore.createdBy.name}
                    </p>
                    <Link
                      href={`/chores/${chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white shadow p-6">
                <p className="text-gray-500">No assigned chores yet.</p>
              </div>
            )}
          </div>

          {/* My Applications */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Applications ({applications?.length || 0})
            </h2>
            {applications && applications.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.chore.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          app.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                          app.chore.status
                        )}`}
                      >
                        {app.chore.status.replace('_', ' ')}
                      </span>
                    </div>
                    {app.bidAmount && (
                      <p className="text-sm text-gray-600 mb-3">
                        Bid: ${app.bidAmount}
                      </p>
                    )}
                    <Link
                      href={`/chores/${app.chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white shadow p-6">
                <p className="text-gray-500">No applications yet.</p>
              </div>
            )}
          </div>

          {/* Nearby Offline Chores */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nearby Offline Chores ({nearbyChores?.length || 0})
            </h2>
            {nearbyChores && nearbyChores.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nearbyChores.map((chore) => (
                  <div
                    key={chore.id}
                    className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {chore.title}
                      </h3>
                      <div className="flex gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                            chore.type
                          )}`}
                        >
                          {chore.type}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                          chore.status
                        )}`}
                      >
                        {chore.status.replace('_', ' ')}
                      </span>
                    </div>
                    {chore.locationAddress && (
                      <p className="text-sm text-gray-600 mb-3">
                        📍 {chore.locationAddress}
                      </p>
                    )}
                    {chore.budget && (
                      <p className="text-sm text-gray-600 mb-3">Budget: ${chore.budget}</p>
                    )}
                    <Link
                      href={`/chores/${chore.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {!user.baseLocation && (
                  <div className="rounded-lg bg-white shadow p-4 mb-4">
                    <p className="text-gray-500">
                      Set your base location in your profile to see nearby offline chores.
                    </p>
                  </div>
                )}
                {fallbackOfflineChores && fallbackOfflineChores.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Showing all published offline chores:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {fallbackOfflineChores.map((chore) => (
                        <div
                          key={chore.id}
                          className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {chore.title}
                            </h3>
                            <div className="flex gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                                  chore.type
                                )}`}
                              >
                                {chore.type}
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                                chore.status
                              )}`}
                            >
                              {chore.status.replace('_', ' ')}
                            </span>
                          </div>
                          {chore.locationAddress && (
                            <p className="text-sm text-gray-600 mb-3">
                              📍 {chore.locationAddress}
                            </p>
                          )}
                          {chore.budget && (
                            <p className="text-sm text-gray-600 mb-3">Budget: ${chore.budget}</p>
                          )}
                          <Link
                            href={`/chores/${chore.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Details →
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white shadow p-6">
                    <p className="text-gray-500">No offline chores found.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

