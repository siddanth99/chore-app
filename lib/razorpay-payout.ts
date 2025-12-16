/**
 * Razorpay Payout API Client
 * 
 * This utility provides a client for making Razorpay Payout API calls.
 * Uses direct HTTP requests since Razorpay Node SDK doesn't fully support Payouts API.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER

if (!KEY_ID || !KEY_SECRET) {
  console.warn('Razorpay credentials not configured. Payouts will fail.')
}

/**
 * Create a payout using Razorpay Payouts API
 * 
 * @param workerUpiId - Worker's UPI ID (e.g., "worker@upi")
 * @param workerName - Worker's name
 * @param amountInPaise - Amount to payout in paise
 * @param referenceId - Unique reference ID for idempotency
 * @returns Razorpay payout response
 */
export async function createRazorpayPayout(
  workerUpiId: string,
  workerName: string,
  amountInPaise: number,
  referenceId: string
): Promise<{
  id: string
  entity: string
  fund_account_id?: string
  amount: number
  currency: string
  fees: number
  tax: number
  status: string
  utr?: string
  mode: string
  purpose: string
  fund_account?: any
  notes?: any
  created_at: number
}> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }

  if (!ACCOUNT_NUMBER) {
    throw new Error('RAZORPAY_ACCOUNT_NUMBER not configured')
  }

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

  // First, create or get fund account
  // Note: This is a simplified version. In production, you'd want to:
  // 1. Check if fund account exists for this UPI ID
  // 2. Create it if it doesn't exist
  // 3. Store the fund_account_id for reuse
  // For now, we'll include fund_account in the payout request

  const payoutPayload = {
    account_number: ACCOUNT_NUMBER,
    fund_account: {
      account_type: 'vpa',
      vpa: {
        address: workerUpiId,
      },
      contact: {
        name: workerName,
        email: '', // Optional
        contact: '', // Optional
        type: 'vendor',
      },
    },
    amount: amountInPaise,
    currency: 'INR',
    mode: 'UPI',
    purpose: 'payout',
    queue_if_low_balance: true, // Queue payout if account balance is low
    reference_id: referenceId, // For idempotency
    narration: `Payout for chore ${referenceId}`,
  }

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payoutPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData: any
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { error: errorText }
    }
    throw new Error(
      errorData.error?.description || errorData.error?.message || 'Failed to create payout'
    )
  }

  return await response.json()
}

/**
 * Get payout status from Razorpay
 */
export async function getRazorpayPayoutStatus(payoutId: string): Promise<any> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

  const response = await fetch(`https://api.razorpay.com/v1/payouts/${payoutId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get payout status: ${errorText}`)
  }

  return await response.json()
}

