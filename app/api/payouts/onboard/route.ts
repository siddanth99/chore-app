import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

/**
 * POST /api/payouts/onboard
 * 
 * Worker onboarding for Razorpay Route payouts.
 * Creates a Razorpay Route sub-account and associates UPI fund account.
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

    // Fetch full user data to check onboarding status
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        phone: true,
        baseLocation: true,
        razorpayAccountId: true,
        upiId: true,
      },
    })

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a worker (or allow all users to onboard)
    // Note: Role is UI-only, but we check it here for safety
    if (fullUser.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Only workers can enable payouts' },
        { status: 403 }
      )
    }

    // Check if already onboarded
    if (fullUser.razorpayAccountId) {
      return NextResponse.json(
        { 
          error: 'Payout onboarding already completed',
          accountId: fullUser.razorpayAccountId,
        },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => null)
    const { upiId } = body ?? {}

    if (!upiId || typeof upiId !== 'string' || !upiId.trim()) {
      return NextResponse.json(
        { error: 'UPI ID is required' },
        { status: 400 }
      )
    }

    // Validate UPI ID format (basic check: should contain @)
    if (!upiId.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid UPI ID format. UPI ID should be in format: yourname@upi' },
        { status: 400 }
      )
    }

    // Real Razorpay Route API calls for worker onboarding

    if (!KEY_ID || !KEY_SECRET) {
      console.error('Missing Razorpay credentials')
      return NextResponse.json(
        { error: 'Server payment configuration error' },
        { status: 500 }
      )
    }

    // Use direct HTTP calls to Razorpay Route API
    // Note: The Razorpay Node SDK may not have full Route support, so we use fetch
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

    // Step 1: Create Razorpay Route Account (L1 onboarding)
    const accountPayload: any = {
      email: fullUser.email || `${fullUser.id}@chorebid.in`,
      phone: fullUser.phone || `9999999999`, // Fallback if phone not available
      type: 'route',
      legal_business_name: fullUser.name || 'Worker',
      business_type: 'individual',
      profile: {
        category: 'service',
        subcategory: 'freelancer',
        addresses: {
          registered: {
            street1: fullUser.baseLocation || 'Not provided',
            city: 'Unknown',
            state: 'Unknown',
            postal_code: '000000',
            country: 'IN',
          },
        },
      },
    }

    let accountResponse
    try {
      const accountRes = await fetch('https://api.razorpay.com/v2/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(accountPayload),
      })

      if (!accountRes.ok) {
        const errorText = await accountRes.text()
        console.error('Razorpay account creation failed:', errorText)
        throw new Error(`Razorpay API error: ${accountRes.status}`)
      }

      accountResponse = await accountRes.json()
    } catch (error: any) {
      console.error('Error creating Razorpay account:', error)
      return NextResponse.json(
        { error: `Failed to create payout account: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const accountId = accountResponse.id

    // Step 2: Create contact for the fund account
    let contactId
    try {
      const contactPayload = {
        name: fullUser.name || 'Worker',
        email: fullUser.email || `${fullUser.id}@chorebid.in`,
        contact: fullUser.phone || '9999999999',
        type: 'vendor',
      }

      const contactRes = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(contactPayload),
      })

      if (contactRes.ok) {
        const contactResponse = await contactRes.json()
        contactId = contactResponse.id
      } else {
        console.warn('Contact creation failed, continuing without contact ID')
        contactId = null
      }
    } catch (error: any) {
      console.error('Error creating contact:', error)
      // If contact creation fails, we still have the account, continue
      contactId = null
    }

    // Step 3: Create fund account (UPI)
    let fundAccountId
    if (contactId) {
      try {
        const fundAccountPayload: any = {
          fund_account: {
            account_type: 'vpa',
            vpa: {
              address: upiId.trim(),
            },
          },
        }

        fundAccountPayload.fund_account.contact_id = contactId

        const fundAccountRes = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/fund_accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify(fundAccountPayload),
        })

        if (fundAccountRes.ok) {
          const fundAccountResponse = await fundAccountRes.json()
          fundAccountId = fundAccountResponse.id
        } else {
          console.warn('Fund account creation failed, continuing without fund account ID')
        }
      } catch (error: any) {
        console.error('Error creating fund account:', error)
        // If fund account creation fails, log but don't fail the entire onboarding
        // The account is created and can be used, fund account can be added later
      }
    }

    // Step 4: Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: fullUser.id },
      data: {
        razorpayAccountId: accountId,
        upiId: upiId.trim(),
        payoutOnboardingAt: new Date(),
      },
      select: {
        upiId: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        accountId,
        upiId: updatedUser.upiId,
        message: 'Payout onboarding completed successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in payout onboarding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

