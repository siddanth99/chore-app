import { NextRequest, NextResponse } from 'next/server'
import { listApplicationsForWorker } from '@/server/api/applications'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'

/**
 * GET /api/applications - List applications for the current worker
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(UserRole.WORKER)

    const applications = await listApplicationsForWorker(user.id)

    return NextResponse.json({ applications })
  } catch (error: any) {
    console.error('Error listing applications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 403 }
    )
  }
}

