import { NextRequest, NextResponse } from 'next/server'
import { listPublishedChores } from '@/server/api/chores'
import { getCurrentUser } from '@/server/auth/role'

/**
 * GET /api/chores - List all published chores (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const chores = await listPublishedChores()
    return NextResponse.json({ chores })
  } catch (error) {
    console.error('Error listing chores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chores - Create a new chore (CUSTOMER only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can create chores' },
        { status: 403 }
      )
    }

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
    } = body

    // Validate required fields
    if (!title || !description || !type || !category) {
      return NextResponse.json(
        { error: 'Title, description, type, and category are required' },
        { status: 400 }
      )
    }

    if (type !== 'ONLINE' && type !== 'OFFLINE') {
      return NextResponse.json(
        { error: 'Type must be either ONLINE or OFFLINE' },
        { status: 400 }
      )
    }

    // For OFFLINE chores, require location
    if (type === 'OFFLINE' && !locationAddress) {
      return NextResponse.json(
        { error: 'Location address is required for offline chores' },
        { status: 400 }
      )
    }

    const { createChore } = await import('@/server/api/chores')
    const chore = await createChore({
      title,
      description,
      type,
      category,
      budget: budget ? parseInt(budget) : undefined,
      locationAddress,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
      dueAt,
      createdById: user.id,
    })

    return NextResponse.json({ chore }, { status: 201 })
  } catch (error) {
    console.error('Error creating chore:', error)
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    )
  }
}

