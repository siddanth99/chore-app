import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/signup-request
 * 
 * Stub endpoint - signup OTP flow is disabled.
 * 
 * This endpoint is kept for compatibility but returns a 410 (Gone) error.
 * The signup flow should use /api/auth/signup instead.
 * 
 * OTP infrastructure remains intact for future use or other features.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Signup OTP flow disabled.' },
    { status: 410 }
  )
}


