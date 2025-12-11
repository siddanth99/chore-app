import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { requireAuth, assertOwner, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { ChoreStatus, UserRole } from '@prisma/client'
import { updateChoreSchema } from '@/lib/validation/chore.schema'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    // RBAC: Require authentication
    const user = await requireAuth()
    const { choreId } = await context.params
    const body = await request.json()

    // Validate input with Zod schema (partial update)
    const parsed = updateChoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const validatedInput = parsed.data

    // Load chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
      include: {
        createdBy: {
          select: { id: true },
        },
      },
    })

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    // Role is UI-only - only check ownership, not role
    // Any authenticated user who owns the chore can edit it
    assertOwner(user.id, chore.createdById)

    // Build allowed update data based on status
    const data: any = {}
    const status = chore.status

    if (status === ChoreStatus.DRAFT || status === ChoreStatus.PUBLISHED) {
      // Allow full edit - use validated input
      if (validatedInput.title !== undefined) data.title = validatedInput.title
      if (validatedInput.description !== undefined) data.description = validatedInput.description
      if (validatedInput.type !== undefined) data.type = validatedInput.type
      if (validatedInput.category !== undefined) data.category = validatedInput.category
      if (validatedInput.budget !== undefined) data.budget = validatedInput.budget
      if (validatedInput.locationAddress !== undefined) data.locationAddress = validatedInput.locationAddress
      if (validatedInput.locationLat !== undefined) data.locationLat = validatedInput.locationLat
      if (validatedInput.locationLng !== undefined) data.locationLng = validatedInput.locationLng
      if (validatedInput.dueAt !== undefined) {
        data.dueAt = validatedInput.dueAt ? new Date(validatedInput.dueAt) : null
      }
      if (validatedInput.imageUrl !== undefined) data.imageUrl = validatedInput.imageUrl
    } else if (status === ChoreStatus.ASSIGNED) {
      // Only title + description
      if (validatedInput.title !== undefined) data.title = validatedInput.title
      if (validatedInput.description !== undefined) data.description = validatedInput.description
    } else if (status === ChoreStatus.IN_PROGRESS) {
      // Only description
      if (validatedInput.description !== undefined) data.description = validatedInput.description
    } else {
      return NextResponse.json(
        { error: 'This chore cannot be edited in its current status' },
        { status: 400 }
      )
    }

    data.updatedAt = new Date()

    const updated = await prisma.chore.update({
      where: { id: choreId },
      data,
    })

    return NextResponse.json({ chore: updated })
  } catch (error: any) {
    console.error('Error updating chore:', error)
    
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
    
    // Return proper HTTP status for auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Access denied' },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update chore' },
      { status: 400 }
    )
  }
}

