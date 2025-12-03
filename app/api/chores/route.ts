import { NextRequest, NextResponse } from 'next/server'
import { UserRole, ChoreType } from '@prisma/client'
import { requireRole, getCurrentUser, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { createChore, listPublishedChoresWithFilters, getUniqueCategories } from '@/server/api/chores'
import { choreCreationLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/chores -> list published chores with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter params
    const typeParam = searchParams.get('type')
    const location = searchParams.get('location')
    const category = searchParams.get('category')
    
    // Build filters object
    const filters: { type?: ChoreType; location?: string; category?: string } = {}
    
    if (typeParam === 'ONLINE' || typeParam === 'OFFLINE') {
      filters.type = typeParam as ChoreType
    }
    
    if (location) {
      filters.location = location
    }
    
    if (category) {
      filters.category = category
    }
    
    // Get current user to exclude their own chores if they're a worker
    const user = await getCurrentUser()
    const excludeUserId = user?.role === 'WORKER' ? user.id : undefined
    
    const chores = await listPublishedChoresWithFilters(filters, excludeUserId)
    
    return NextResponse.json({ chores })
  } catch (error) {
    console.error('Error fetching chores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    )
  }
}

// GET /api/chores/categories -> get unique categories (separate endpoint would be cleaner but adding here for simplicity)

// POST /api/chores -> create a new chore (CUSTOMER only)
// Validation is now handled by Zod in server/api/chores.ts
export async function POST(request: NextRequest) {
  try {
    // RBAC: Only customers can create chores
    const user = await requireRole(UserRole.CUSTOMER)

    // Rate limiting: Prevent spam chore creation
    const rateLimitKey = getRateLimitKey(request, user.id)
    const { success, reset } = await choreCreationLimiter.limit(rateLimitKey)
    
    if (!success) {
      return NextResponse.json(
        createRateLimitResponse(reset, 'Rate limit exceeded. You can create more chores later.'),
        { status: 429 }
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
      imageUrl: rawImageUrl,
    } = body

    // Normalize imageUrl to string or null, never undefined
    const imageUrl = rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim() 
      ? rawImageUrl.trim() 
      : null

    // Create chore - Zod validation happens inside createChore()
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
      imageUrl: imageUrl,
      createdById: user.id, // Always from session
    })

    return NextResponse.json({ chore }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating chore:', error)
    
    // Handle validation errors (INVALID_INPUT from Zod)
    if (error instanceof AuthorizationError && error.code === AUTH_ERRORS.INVALID_INPUT) {
      try {
        const validationErrors = JSON.parse(error.message)
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        )
      } catch {
        return NextResponse.json(
          { error: error.message || 'Invalid input' },
          { status: 400 }
        )
      }
    }
    
    // Return proper HTTP status for other auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Access denied' },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create chore' },
      { status: 400 }
    )
  }
}