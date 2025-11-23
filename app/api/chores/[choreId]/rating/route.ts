import { NextRequest, NextResponse } from 'next/server'
import {
  addRating,
  getRatingForChoreAndUser,
  getRatingForChore,
} from '@/server/api/ratings'
import { requireAuth } from '@/server/auth/role'

/**
 * GET /api/chores/[choreId]/rating - Get rating for this chore
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await requireAuth()
    const { choreId } = await context.params

    const myRating = await getRatingForChoreAndUser(choreId, user.id)
    const choreRating = await getRatingForChore(choreId)

    return NextResponse.json({ myRating, choreRating })
  } catch (error: any) {
    console.error('Error fetching rating:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rating' },
      { status: 400 }
    )
  }
}

/**
 * POST /api/chores/[choreId]/rating - Add or update rating for this chore
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await requireAuth()
    const { choreId } = await context.params

    const body = await request.json()
    const { score, comment } = body

    // Validate score
    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Score must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Call the ratings service
    const rating = await addRating({
      choreId,
      fromUserId: user.id,
      score,
      comment,
    })

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit rating' },
      { status: 400 }
    )
  }
}