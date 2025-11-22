import { NextRequest, NextResponse } from 'next/server'
import { createApplication, listApplicationsForChore } from '@/server/api/applications'
import { requireAuth, requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'

/**
 * POST /api/chores/[choreId]/applications - Create an application/bid (WORKER only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireRole(UserRole.WORKER)
    const { choreId } = params
    const body = await request.json()
    const { bidAmount, message } = body

    const application = await createApplication({
      choreId,
      workerId: user.id,
      bidAmount: bidAmount ? parseInt(bidAmount) : undefined,
      message,
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create application' },
      { status: 400 }
    )
  }
}

/**
 * GET /api/chores/[choreId]/applications - List applications for a chore (CUSTOMER owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireRole(UserRole.CUSTOMER)
    const { choreId } = params

    const applications = await listApplicationsForChore(choreId, user.id)

    return NextResponse.json({ applications })
  } catch (error: any) {
    console.error('Error listing applications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 403 }
    )
  }
}

