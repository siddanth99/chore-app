import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { requireAuth } from '@/server/auth/role'
import { ChoreStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await requireAuth()
    const { choreId } = await context.params
    const body = await request.json()

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

    if (chore.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this chore' },
        { status: 403 }
      )
    }

    // Build allowed update data based on status
    const data: any = {}
    const status = chore.status

    if (status === ChoreStatus.DRAFT || status === ChoreStatus.PUBLISHED) {
      // Allow full edit
      if (typeof body.title === 'string') data.title = body.title
      if (typeof body.description === 'string') data.description = body.description
      if (body.type === 'ONLINE' || body.type === 'OFFLINE') data.type = body.type
      if (typeof body.category === 'string') data.category = body.category
      if (body.budget === null || typeof body.budget === 'number')
        data.budget = body.budget
      if (
        typeof body.locationAddress === 'string' ||
        body.locationAddress === null
      )
        data.locationAddress = body.locationAddress
      if (
        typeof body.locationLat === 'number' ||
        body.locationLat === null
      )
        data.locationLat = body.locationLat
      if (
        typeof body.locationLng === 'number' ||
        body.locationLng === null
      )
        data.locationLng = body.locationLng
      if (body.dueAt === null || typeof body.dueAt === 'string')
        data.dueAt = body.dueAt ? new Date(body.dueAt) : null
      if (typeof body.imageUrl === 'string' || body.imageUrl === null)
        data.imageUrl = body.imageUrl
    } else if (status === ChoreStatus.ASSIGNED) {
      // Only title + description
      if (typeof body.title === 'string') data.title = body.title
      if (typeof body.description === 'string') data.description = body.description
    } else if (status === ChoreStatus.IN_PROGRESS) {
      // Only description
      if (typeof body.description === 'string') data.description = body.description
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
    return NextResponse.json(
      { error: error.message || 'Failed to update chore' },
      { status: 400 }
    )
  }
}

