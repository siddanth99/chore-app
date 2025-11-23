// web/app/api/applications/[applicationId]/assign/route.ts
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/server/auth/role'
import { assignApplication } from '@/server/api/applications'

// In Next 15, params is a Promise – we model that here
type AssignParams = Promise<{ applicationId: string }>

export async function POST(
  request: Request,
  { params }: { params: AssignParams }
) {
  try {
    // Only CUSTOMERS can assign
    const user = await requireRole(UserRole.CUSTOMER)

    // 🔑 IMPORTANT: await params before using applicationId
    const { applicationId } = await params

    const result = await assignApplication(applicationId, user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error assigning application:', error)
    return NextResponse.json(
      { error: error.message ?? 'Failed to assign application' },
      { status: 400 }
    )
  }
}