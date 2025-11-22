import { NextRequest, NextResponse } from 'next/server'
import { addRating } from '@/server/api/ratings'
import { requireAuth } from '@/server/auth/role'
import { prisma } from '@/server/db/client'

/**
 * POST /api/chores/[choreId]/rating - Add a rating for a completed chore
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireAuth()
    const { choreId } = params
    const body = await request.json()
    const { score, comment } = body

    // Validate score
    if (!score || typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Rating score must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Get the chore to determine the ratee
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
      select: {
        createdById: true,
        assignedWorkerId: true,
        status: true,
      },
    })

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    // Determine who is being rated
    const isCustomer = chore.createdById === user.id
    const isWorker = chore.assignedWorkerId === user.id

    if (!isCustomer && !isWorker) {
      return NextResponse.json(
        { error: 'Only the customer or assigned worker can rate' },
        { status: 403 }
      )
    }

    const rateeId = isCustomer ? chore.assignedWorkerId : chore.createdById

    if (!rateeId) {
      return NextResponse.json(
        { error: 'Cannot rate: no assigned worker' },
        { status: 400 }
      )
    }

    const rating = await addRating({
      choreId,
      raterId: user.id,
      rateeId,
      score,
      comment: comment || undefined,
    })

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding rating:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add rating' },
      { status: 400 }
    )
  }
}

