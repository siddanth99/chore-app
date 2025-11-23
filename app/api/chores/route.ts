import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/server/auth/role'
import { createChore } from '@/server/api/chores'

// POST /api/chores -> create a new chore (CUSTOMER only)
export async function POST(request: NextRequest) {
  try {
    // Only customers can create chores
    const user = await requireRole(UserRole.CUSTOMER)

    const body = await request.json()
    const {
      title,
      description,
      type,
      category,
      budget,
      locationAddress,
      locationLat,
      locationLng,
      dueAt,
      imageUrl: rawImageUrl,
    } = body

    // Normalize imageUrl to string or null, never undefined
    // Also convert empty strings to null
    const imageUrl = rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim() 
      ? rawImageUrl.trim() 
      : null

    if (!title || !description || !type || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type, category' },
        { status: 400 }
      )
    }

    // Validate OFFLINE chores must have coordinates
    if (type === 'OFFLINE') {
      if (
        locationLat === undefined ||
        locationLat === null ||
        locationLng === undefined ||
        locationLng === null
      ) {
        return NextResponse.json(
          { error: 'Location coordinates (latitude and longitude) are required for offline chores' },
          { status: 400 }
        )
      }
    }

    const chore = await createChore({
      title,
      description,
      type,
      category,
      budget: budget !== undefined && budget !== null ? Number(budget) : undefined,
      locationAddress: locationAddress || undefined,
      locationLat: locationLat !== undefined && locationLat !== null ? Number(locationLat) : undefined,
      locationLng: locationLng !== undefined && locationLng !== null ? Number(locationLng) : undefined,
      dueAt: dueAt || undefined,
      imageUrl: imageUrl, // Already normalized to string | null above
      createdById: user.id,
    })

    return NextResponse.json({ chore }, { status: 201 })
  } catch (error) {
    console.error('Error creating chore:', error)
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 400 }
    )
  }
}