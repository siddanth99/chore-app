import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { $Enums } from '@prisma/client'

type UserRole = $Enums.UserRole

/**
 * PATCH /api/profile/role
 * 
 * Update the current user's role.
 * Allows switching between CUSTOMER and WORKER modes.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role } = body

    // Validate role value
    if (!role || (role !== 'CUSTOMER' && role !== 'WORKER')) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CUSTOMER or WORKER.' },
        { status: 400 }
      )
    }

    // Prevent changing to ADMIN via this endpoint (security)
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot set role to ADMIN via this endpoint.' },
        { status: 403 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: role as UserRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(
      { 
        message: 'Role updated successfully',
        user: updatedUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

