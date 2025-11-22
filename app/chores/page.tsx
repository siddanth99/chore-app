import { listPublishedChoresWithFilters } from '@/server/api/chores'
import Link from 'next/link'
import { getCurrentUser } from '@/server/auth/role'
import { ChoreStatus, ChoreType } from '@prisma/client'
import ChoresListClient from './chores-list-client'

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: { type?: string; location?: string }
}) {
  const filters: { type?: ChoreType; location?: string } = {}
  if (searchParams.type && (searchParams.type === 'ONLINE' || searchParams.type === 'OFFLINE')) {
    filters.type = searchParams.type
  }
  if (searchParams.location) {
    filters.location = searchParams.location
  }

  const chores = await listPublishedChoresWithFilters(filters)
  const user = await getCurrentUser()

  return <ChoresListClient chores={chores} user={user} initialFilters={filters} />

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
                    <div className="flex gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {chore.type}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {chore.status.replace('_', ' ')}
                      </span>
                    </div>
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

