import { NextRequest, NextResponse } from 'next/server'
import { UserRole, ChoreType } from '@prisma/client'
import { requireRole, getCurrentUser, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { createChore, listPublishedChoresWithFilters, getUniqueCategories } from '@/server/api/chores'
import { choreCreationLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

// Note: In Next.js App Router, body size limits are handled by the runtime
// For large payloads (base64 images), ensure the deployment platform allows sufficient body size

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

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { ok: false, message: 'Invalid request body' },
        { status: 400 }
      )
    }

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
    let result
    try {
      result = await createChore({
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
    } catch (dbError: any) {
      // Handle database errors (e.g., image too large for column)
      if (dbError.code === 'P2000' || dbError.message?.includes('too large')) {
        return NextResponse.json(
          { ok: false, message: 'Image upload failed. Please try again.' },
          { status: 400 }
        )
      }
      throw dbError
    }

    // If validation failed, createChore returns a NextResponse with structured errors
    if (result instanceof NextResponse) {
      return result
    }

    // Success - result is the created chore
    return NextResponse.json({ ok: true, chore: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating chore:', error)
    
    // Return proper HTTP status for auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { ok: false, error: error.message || 'Access denied' },
        { status }
      )
    }
    
    // Handle image processing errors
    if (error.message?.includes('image') || error.message?.includes('upload')) {
      return NextResponse.json(
        { ok: false, message: 'Image upload failed. Please try again.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create chore' },
      { status: 500 }
    )
  }
}