import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'

/**
 * GET /api/worker/payout-settings
 * 
 * Get the current user's payout settings (UPI ID and payouts enabled toggle).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        upiId: true,
        payoutsEnabled: true,
      },
    })

    return NextResponse.json(
      userSettings ?? { upiId: null, payoutsEnabled: false },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching payout settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/worker/payout-settings
 * 
 * Update the current user's payout settings (UPI ID and payouts enabled toggle).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)
    const { payoutUpiId, payoutsEnabled } = body ?? {}

    // Validate inputs
    if (payoutsEnabled !== undefined && typeof payoutsEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'payoutsEnabled must be a boolean' },
        { status: 400 }
      )
    }

    // If enabling payouts and UPI ID is provided, validate format
    if (payoutsEnabled && payoutUpiId && typeof payoutUpiId === 'string') {
      if (!payoutUpiId.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid UPI ID format. UPI ID should be in format: yourname@upi' },
          { status: 400 }
        )
      }
    }

    // Build update data object (only include fields that are provided)
    const updateData: { upiId?: string | null; payoutsEnabled?: boolean } = {}
    if (payoutUpiId !== undefined) {
      updateData.upiId = payoutUpiId || null
    }
    if (payoutsEnabled !== undefined) {
      updateData.payoutsEnabled = Boolean(payoutsEnabled)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        upiId: true,
        payoutsEnabled: true,
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating payout settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

