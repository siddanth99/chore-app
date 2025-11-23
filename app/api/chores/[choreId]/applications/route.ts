import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/server/auth/role'
import { UserRole } from '@prisma/client'
import { createApplication } from '@/server/api/applications'

// Next.js 14+ — dynamic route params are a Promise and must be awaited
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    // Ensure only workers can apply
    const user = await requireRole(UserRole.WORKER)

    // ✅ unwrap params promise
    const { choreId } = await context.params

    if (!choreId) {
      return NextResponse.json({ error: "Missing choreId" }, { status: 400 })
    }

    const body = await request.json()
    const { bidAmount, message } = body

    // Create application
    const application = await createApplication({
      choreId,
      workerId: user.id,
      bidAmount:
        bidAmount !== undefined && bidAmount !== null
          ? Number(bidAmount)
          : undefined,
      message: message || undefined,
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 400 }
    )
  }
}