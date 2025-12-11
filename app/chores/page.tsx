// web/app/chores/page.tsx
import { ChoreType } from '@prisma/client'
import { getCurrentUser } from '@/server/auth/role'
import {
  listPublishedChoresWithFilters,
  getChoresWithinDistance,
  getUniqueCategories,
} from '@/server/api/chores'
import { getCategoryNames } from '@/server/api/categories'
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

  // Handle category filter - can be single category or array of categories
  // For server-side filtering, we'll use the first category or handle array
  if (resolved.categories) {
    const cats = Array.isArray(resolved.categories) ? resolved.categories : [resolved.categories];
    if (cats.length > 0) {
      // Server filter uses first category for now (case-insensitive matching handles variations)
      serverFilters.category = cats[0];
    }
  } else if (resolved.category) {
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
  const [chores, categoryNames] = await Promise.all([
    isDistanceFilterActive
      ? getChoresWithinDistance(workerLat, workerLng, distanceKm, undefined)
      : listPublishedChoresWithFilters(serverFilters, undefined),
    getCategoryNames(), // Gets real categories + popular fallback
  ])

  // Transform category names to filter format (id/label pairs)
  const categories: Array<{ id: string; label: string }> = categoryNames.map(cat => ({
    id: cat.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    label: cat,
  }))

  // Transform URL params to browse-v2 Filters format
  // Handle both single category and categories array
  let categoriesFilter: string[] | undefined = undefined;
  if (resolved.categories) {
    if (Array.isArray(resolved.categories)) {
      categoriesFilter = resolved.categories.map(c => c.toLowerCase().trim()).filter(Boolean);
    } else {
      categoriesFilter = [resolved.categories.toLowerCase().trim()];
    }
  } else if (resolved.category) {
    categoriesFilter = [resolved.category.toLowerCase().trim()];
  }
  // Set to undefined if empty array, not empty array
  if (categoriesFilter && categoriesFilter.length === 0) {
    categoriesFilter = undefined;
  }

  const browseV2Filters: Filters = {
    q: resolved.q || undefined,
    categories: categoriesFilter,
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
