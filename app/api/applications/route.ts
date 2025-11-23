import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/server/auth/role'
import { listApplicationsForWorkerDashboard } from '@/server/api/applications'

// GET /api/applications
// Returns the current worker's applications for use in the dashboard
export async function GET() {
  try {
    // Only workers should hit this endpoint
    const user = await requireRole(UserRole.WORKER)

    const applications = await listApplicationsForWorkerDashboard(user.id)

    return NextResponse.json({ applications })
  } catch (err: any) {
    console.error('Error in GET /api/applications:', err)

    // If requireRole threw, it already sent a 401/403 in practice,
    // but we keep a generic 500 fallback here.
    return NextResponse.json(
      { error: err.message ?? 'Failed to load applications' },
      { status: 500 }
    )
  }
}