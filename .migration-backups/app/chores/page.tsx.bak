// web/app/chores/page.tsx
import { ChoreType } from '@prisma/client'
import { getCurrentUser } from '@/server/auth/role'
import {
  listPublishedChoresWithFilters,
  getChoresWithinDistance,
  getUniqueCategories,
} from '@/server/api/chores'
import ChoresListClient from './chores-list-client'

type RawSearchParams = {
  type?: string
  location?: string
  category?: string
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

  const filters: { type?: ChoreType; location?: string; category?: string } = {}

  if (resolved.type === 'ONLINE' || resolved.type === 'OFFLINE') {
    filters.type = resolved.type as ChoreType
  }

  if (resolved.location) {
    filters.location = resolved.location
  }

  if (resolved.category) {
    filters.category = resolved.category
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

  // Fetch chores and categories in parallel
  const [chores, categories] = await Promise.all([
    isDistanceFilterActive
      ? getChoresWithinDistance(workerLat, workerLng, distanceKm, excludeUserId)
      : listPublishedChoresWithFilters(filters, excludeUserId),
    getUniqueCategories(),
  ])

  return (
    <ChoresListClient
      chores={chores}
      user={user}
      initialFilters={filters}
      initialWorkerLat={!Number.isNaN(workerLat) ? workerLat : null}
      initialWorkerLng={!Number.isNaN(workerLng) ? workerLng : null}
      initialDistanceKm={!Number.isNaN(distanceKm) ? distanceKm : 10}
      availableCategories={categories}
    />
  )
}