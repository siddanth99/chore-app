import { NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'

/**
 * GET /api/categories
 * Returns distinct categories from published chores with normalized IDs and labels
 */
export async function GET() {
  try {
    const chores = await prisma.chore.findMany({
      where: { status: ChoreStatus.PUBLISHED },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    // Normalize category key for consistent matching
    function normalizeKey(s: string | undefined | null): string {
      return (s ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    }

    // Derive distinct categories with normalized IDs
    const categoryMap = new Map<string, { id: string; label: string }>()
    
    chores.forEach((c) => {
      if (c.category) {
        const id = normalizeKey(c.category)
        if (!categoryMap.has(id)) {
          categoryMap.set(id, { id, label: c.category })
        }
      }
    })

    const categories = Array.from(categoryMap.values())

    return NextResponse.json({ ok: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

