// web/app/chores/page.tsx
import Link from 'next/link'
import { ChoreType } from '@prisma/client'
import { getCurrentUser } from '@/server/auth/role'
import {
  listPublishedChoresWithFilters,
  getChoresWithinDistance,
} from '@/server/api/chores'
import ChoresListClient from './chores-list-client'

type RawSearchParams = {
  type?: string
  location?: string
  workerLat?: string
  workerLng?: string
  distanceKm?: string
}

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  // Next 15/16: searchParams is a Promise
  const resolved = await searchParams

  const filters: { type?: ChoreType; location?: string } = {}

  if (resolved.type === 'ONLINE' || resolved.type === 'OFFLINE') {
    filters.type = resolved.type as ChoreType
  }

  if (resolved.location) {
    filters.location = resolved.location
  }

  const user = await getCurrentUser()
  const excludeUserId = user?.role === 'WORKER' ? user.id : undefined

  // Parse distance params
  const workerLat = resolved.workerLat ? parseFloat(resolved.workerLat) : NaN
  const workerLng = resolved.workerLng ? parseFloat(resolved.workerLng) : NaN
  const distanceKm = resolved.distanceKm ? parseFloat(resolved.distanceKm) : NaN

  const isDistanceFilterActive =
    user?.role === 'WORKER' &&
    !Number.isNaN(workerLat) &&
    !Number.isNaN(workerLng) &&
    !Number.isNaN(distanceKm) &&
    workerLat >= -90 &&
    workerLat <= 90 &&
    workerLng >= -180 &&
    workerLng <= 180 &&
    distanceKm >= 0

  let chores: any[] = []

  if (isDistanceFilterActive) {
    chores = await getChoresWithinDistance(
      workerLat,
      workerLng,
      distanceKm,
      excludeUserId,
    )
  } else {
    chores = await listPublishedChoresWithFilters(filters, excludeUserId)
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

        <ChoresListClient
          chores={chores}
          user={user}
          initialFilters={filters}
          initialWorkerLat={!Number.isNaN(workerLat) ? workerLat : null}
          initialWorkerLng={!Number.isNaN(workerLng) ? workerLng : null}
          initialDistanceKm={!Number.isNaN(distanceKm) ? distanceKm : 10}
        />
      </div>
    </div>
  )
}