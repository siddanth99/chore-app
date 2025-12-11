// web/app/chores/page.tsx
import { ChoreType } from '@prisma/client'
import { getCurrentUser } from '@/server/auth/role'
import {
  listPublishedChoresWithFilters,
  getChoresWithinDistance,
  getUniqueCategories,
} from '@/server/api/chores'
import { BrowseChoresClient } from '@/components/chores/BrowseChoresClient'
import { Filters } from '@/components/chores/types'

type RawSearchParams = {
  type?: string
  location?: string
  category?: string
  workerLat?: string
  workerLng?: string
  distanceKm?: string
  q?: string // Search query for browse-v2
  categories?: string | string[] // Multiple categories for browse-v2
  minBudget?: string
  maxBudget?: string
  status?: string | string[]
  view?: string // View mode: tiles, grid, list, map
}

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  // Next 15/16: searchParams is a Promise
  const resolved = await searchParams

  // Build server-side filters (for Prisma query)
  const serverFilters: { 
    type?: ChoreType; 
    location?: string; 
    category?: string;
    minBudget?: number | null;
    maxBudget?: number | null;
  } = {}

  if (resolved.type === 'ONLINE' || resolved.type === 'OFFLINE') {
    serverFilters.type = resolved.type as ChoreType
  }

  if (resolved.location) {
    serverFilters.location = resolved.location
  }

  if (resolved.category) {
    serverFilters.category = resolved.category
  }

  // Add budget filters to server query if provided
  if (resolved.minBudget) {
    serverFilters.minBudget = parseFloat(resolved.minBudget);
  }
  if (resolved.maxBudget) {
    serverFilters.maxBudget = parseFloat(resolved.maxBudget);
  }

  const user = await getCurrentUser()
  // Don't exclude user's own chores - role is UI-only, not permission-based

  // Parse distance params
  const workerLat = resolved.workerLat ? parseFloat(resolved.workerLat) : NaN
  const workerLng = resolved.workerLng ? parseFloat(resolved.workerLng) : NaN
  const distanceKm = resolved.distanceKm ? parseFloat(resolved.distanceKm) : NaN

  // Distance filter can be active for any user (not just WORKER role)
  const isDistanceFilterActive =
    !Number.isNaN(workerLat) &&
    !Number.isNaN(workerLng) &&
    !Number.isNaN(distanceKm) &&
    workerLat >= -90 &&
    workerLat <= 90 &&
    workerLng >= -180 &&
    workerLng <= 180 &&
    distanceKm >= 0

  // Fetch chores and categories in parallel
  const [chores, categoriesFromDb] = await Promise.all([
    isDistanceFilterActive
      ? getChoresWithinDistance(workerLat, workerLng, distanceKm, undefined)
      : listPublishedChoresWithFilters(serverFilters, undefined),
    getUniqueCategories(),
  ])

  // Fetch categories from API (normalized with IDs)
  let categories: Array<{ id: string; label: string }> = []
  try {
    const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/categories`, {
      cache: 'no-store',
    })
    if (categoriesRes.ok) {
      const data = await categoriesRes.json()
      if (data.ok && Array.isArray(data.categories)) {
        categories = data.categories
      }
    }
  } catch (e) {
    // Fallback: derive from DB categories
    categories = categoriesFromDb.map(cat => ({
      id: cat.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
      label: cat,
    }))
  }

  // Transform URL params to browse-v2 Filters format
  const browseV2Filters: Filters = {
    q: resolved.q || undefined,
    categories: Array.isArray(resolved.categories)
      ? resolved.categories
      : resolved.categories
      ? [resolved.categories]
      : resolved.category
      ? [resolved.category]
      : undefined,
    type:
      resolved.type === 'ONLINE'
        ? 'online'
        : resolved.type === 'OFFLINE'
        ? 'offline'
        : 'all',
    minBudget: resolved.minBudget ? parseFloat(resolved.minBudget) : undefined,
    maxBudget: resolved.maxBudget ? parseFloat(resolved.maxBudget) : undefined,
    status: Array.isArray(resolved.status)
      ? resolved.status
      : resolved.status
      ? [resolved.status]
      : undefined,
    nearMe: isDistanceFilterActive,
  }

  // View param is handled client-side by BrowseChoresClient (reads from URL on mount)

  // Compute a server-side snapshot count for visible chores.
  // Use the full chores list length as the initial count (client will update after mount).
  const initialCount = Array.isArray(chores) ? chores.length : 0;
  
  // Compute totalCount server-side (count of chores matching server filters)
  const initialTotalCount = Array.isArray(chores) ? chores.length : 0;

  return (
    <BrowseChoresClient
      initialChores={chores}
      initialFilters={browseV2Filters}
      initialCategories={categories}
      initialCount={initialCount}
      initialTotalCount={initialTotalCount}
    />
  )
}
