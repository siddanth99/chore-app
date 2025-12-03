// web/app/api/notifications/test-webhook/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

async function forwardToPabbly(payload: any) {
  const url = process.env.PABBLY_WEBHOOK_URL
  if (!url) return { forwarded: false, reason: 'PABBLY_WEBHOOK_URL not set' }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // small timeout pattern is not available in fetch without AbortController; keep simple
    })
    const text = await res.text()
    return { forwarded: true, status: res.status, body: text }
  } catch (err: any) {
    return { forwarded: true, error: String(err) }
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))

    // Basic validation — ensure we have some fields
    if (!payload || Object.keys(payload).length === 0) {
      // still respond ok to test reachability
      return NextResponse.json({ ok: true, received: false, reason: 'empty payload' })
    }

    // Optionally log to server console for dev visibility
    // (This will appear in the terminal running `npm run dev`.)
    console.log('[test-webhook] received payload:', JSON.stringify(payload).slice(0, 1000))

    // Forward to Pabbly if configured (non-blocking-ish — we await for visibility)
    const forwardResult = await forwardToPabbly(payload)

    return NextResponse.json({ ok: true, received: true, forwarded: forwardResult })
  } catch (err: any) {
    console.error('[test-webhook] error:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    )
  }
}

export function GET() {
  // helpful quick info when you open the URL in browser
  return NextResponse.json({
    ok: true,
    info: 'POST JSON to this endpoint to test notifications forwarding. Use POST only.',
  })
}