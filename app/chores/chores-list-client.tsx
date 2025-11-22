'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChoreStatus, ChoreType } from '@prisma/client'

interface ChoresListClientProps {
  chores: any[]
  user: any
  initialFilters: { type?: ChoreType; location?: string }
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

export default function ChoresListClient({
  chores,
  user,
  initialFilters,
}: ChoresListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<string>(initialFilters.type || 'ALL')
  const [locationFilter, setLocationFilter] = useState<string>(initialFilters.location || '')

  const handleFilterChange = () => {
    const params = new URLSearchParams()
    if (typeFilter && typeFilter !== 'ALL') {
      params.set('type', typeFilter)
    }
    if (locationFilter) {
      params.set('location', locationFilter)
    }
    router.push(`/chores?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Available Chores</h1>
          {user?.role === 'CUSTOMER' && (
            <Link
              href="/chores/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Create New Chore
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white shadow p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="typeFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="locationFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location (contains)
              </label>
              <input
                type="text"
                id="locationFilter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Enter location..."
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilterChange}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {chores.length === 0 ? (
          <div className="rounded-lg bg-white shadow px-6 py-12 text-center">
            <p className="text-gray-500">No published chores available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chores.map((chore) => (
              <div
                key={chore.id}
                className="rounded-lg bg-white shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{chore.title}</h2>
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

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {chore.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Category:</span>
                      <span className="ml-2">{chore.category}</span>
                    </div>
                    {chore.budget && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Budget:</span>
                        <span className="ml-2">${chore.budget}</span>
                      </div>
                    )}
                    {chore.type === 'OFFLINE' && chore.locationAddress && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Location:</span>
                        <span className="ml-2 truncate">{chore.locationAddress}</span>
                      </div>
                    )}
                    {chore.dueAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Due:</span>
                        <span className="ml-2">
                          {new Date(chore.dueAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Applications:</span>
                      <span className="ml-2">{chore._count.applications}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                      By {chore.createdBy.name}
                    </span>
                    <Link
                      href={`/chores/${chore.id}`}
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

