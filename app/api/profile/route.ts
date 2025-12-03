// app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth/config'
import { prisma } from '@/server/db/client'

/**
 * POST /api/profile - Update the signed-in user's profile
 * 
 * Expected body:
 * {
 *   name?: string
 *   bio?: string
 *   phone?: string        // Note: requires schema migration to add phone field
 *   baseLocation?: string
 *   skills?: string[]     // Note: requires schema migration to add skills field
 *   hourlyRate?: number   // Note: requires schema migration to add hourlyRate field
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate request
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { name, bio, phone, baseLocation, skills, hourlyRate } = body

    // 3. Validate inputs
    // TODO: Add stricter validation (e.g., zod schema)
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string' }, { status: 400 })
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 })
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone must be a string' }, { status: 400 })
    }

    if (baseLocation !== undefined && typeof baseLocation !== 'string') {
      return NextResponse.json({ error: 'Location must be a string' }, { status: 400 })
    }

    if (hourlyRate !== undefined && hourlyRate !== null && typeof hourlyRate !== 'number') {
      return NextResponse.json({ error: 'Hourly rate must be a number' }, { status: 400 })
    }

    // TODO: track analytics for profile update event

    // 4. Build update data object (only include fields that are present)
    // Note: Some fields like phone, skills, hourlyRate may require schema migration
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (bio !== undefined) updateData.bio = bio.trim() || null
    if (baseLocation !== undefined) updateData.baseLocation = baseLocation.trim() || null
    
    // These fields may not exist in schema yet - wrap in try/catch or check schema
    // For now, we'll include them and let Prisma handle unknown fields gracefully
    // TODO: Run `npx prisma migrate dev --name add_profile_fields` after adding to schema
    // Uncomment after migration:
    // if (phone !== undefined) updateData.phone = phone.trim() || null
    // if (skills !== undefined) updateData.skills = JSON.stringify(skills)
    // if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate

    // 5. Perform update
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        baseLocation: true,
        role: true,
        createdAt: true,
      },
    })

    // 6. Return success response
    return NextResponse.json({
      ok: true,
      user: updated,
    })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * GET /api/profile - Get the signed-in user's profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        baseLocation: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, user })
  } catch (err) {
    console.error('Profile fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

