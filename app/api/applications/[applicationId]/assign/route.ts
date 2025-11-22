import { NextRequest, NextResponse } from 'next/server'
import { assignApplication } from '@/server/api/applications'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'

/**
 * POST /api/applications/[applicationId]/assign - Assign a chore to a worker (CUSTOMER owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const user = await requireRole(UserRole.CUSTOMER)
    const { applicationId } = params

    const result = await assignApplication(applicationId, user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error assigning application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign application' },
      { status: 400 }
    )
  }
}

