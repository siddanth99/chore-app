import { prisma } from '../db/client'
import { ChoreStatus } from '@prisma/client'

/**
 * Popular categories list - used as fallback when database has few/no categories
 */
export const POPULAR_CATEGORIES = [
  'Cleaning',
  'Moving',
  'Repairs',
  'Cooking',
  'Delivery',
  'Pet Care',
] as const

export type CategoryWithCount = {
  name: string
  count: number
  isFromData: boolean
}

/**
 * Get categories with counts from actual chores in the database
 * Returns categories that exist in the DB, supplemented with popular categories
 * 
 * @param includeUnpublished - If true, include DRAFT chores. Default: only PUBLISHED
 * @returns Array of categories with their counts and whether they're from real data
 */
export async function getCategoriesWithCounts(
  includeUnpublished = false
): Promise<CategoryWithCount[]> {
  // Get all chores (published only by default)
  const where = includeUnpublished
    ? {}
    : { status: ChoreStatus.PUBLISHED }

  const chores = await prisma.chore.findMany({
    where,
    select: { category: true },
  })

  // Group by category and count
  const categoryCounts = new Map<string, number>()
  for (const chore of chores) {
    if (chore.category) {
      const count = categoryCounts.get(chore.category) || 0
      categoryCounts.set(chore.category, count + 1)
    }
  }

  // Build list with real categories first
  const result: CategoryWithCount[] = Array.from(categoryCounts.entries()).map(
    ([name, count]) => ({
      name,
      count,
      isFromData: true,
    })
  )

  // Sort by count (descending), then by name
  result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.name.localeCompare(b.name)
  })

  // Add popular categories that aren't already in the list
  const existingNames = new Set(result.map(c => c.name.toLowerCase()))
  for (const popular of POPULAR_CATEGORIES) {
    if (!existingNames.has(popular.toLowerCase())) {
      result.push({
        name: popular,
        count: 0,
        isFromData: false,
      })
    }
  }

  return result
}

/**
 * Get category names only (for filter dropdowns)
 * Returns real categories from DB, supplemented with popular ones
 */
export async function getCategoryNames(): Promise<string[]> {
  const categoriesWithCounts = await getCategoriesWithCounts()
  return categoriesWithCounts.map(c => c.name)
}
