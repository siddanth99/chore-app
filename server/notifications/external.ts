// web/server/notifications/external.ts
import { prisma } from '@/server/db/client'

export type ExternalNotificationPayload = {
  notificationId?: string | null
  userId: string
  email?: string | null
  phone?: string | null
  channel?: 'email' | 'sms' | 'whatsapp' | 'any'
  event: string
  title: string
  message: string
  link?: string | null
  meta?: Record<string, any>
}

const PABBLY_WEBHOOK = process.env.PABBLY_WEBHOOK_URL

async function recordDelivery(params: {
  notificationId?: string | null
  userId: string
  provider: string
  status: string
  response?: string | null
  retryCount?: number
}) {
  try {
    await prisma.notificationDelivery.create({
      data: {
        notificationId: params.notificationId ?? null,
        userId: params.userId,
        provider: params.provider,
        providerResponse: params.response ?? null,
        status: params.status,
        retryCount: params.retryCount ?? 0,
      },
    })
  } catch (e) {
    console.error('Failed to write NotificationDelivery', e)
  }
}

export async function sendExternalNotification(payload: ExternalNotificationPayload) {
  if (!PABBLY_WEBHOOK) {
    return { ok: false, reason: 'PABBLY_WEBHOOK_URL not configured' }
  }

  const body = {
    userId: payload.userId,
    email: payload.email || null,
    phone: payload.phone || null,
    channel: payload.channel || 'any',
    event: payload.event,
    title: payload.title,
    message: payload.message,
    link: payload.link || null,
    meta: payload.meta || {},
  }

  let attempt = 0
  const maxAttempts = 3
  const provider = 'pabbly'
  while (attempt < maxAttempts) {
    attempt++
    try {
      const res = await fetch(PABBLY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      const status = res.ok ? 'sent' : 'failed'
      await recordDelivery({
        notificationId: payload.notificationId ?? null,
        userId: payload.userId,
        provider,
        status,
        response: `status:${res.status} body:${text}`,
        retryCount: attempt - 1,
      })
      if (res.ok) return { ok: true, status: res.status, text }
      // else continue retry
    } catch (err: any) {
      await recordDelivery({
        notificationId: payload.notificationId ?? null,
        userId: payload.userId,
        provider,
        status: 'failed',
        response: String(err?.message || err),
        retryCount: attempt - 1,
      })
    }
    // Exponential backoff
    await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)))
  }

  return { ok: false, reason: 'max attempts reached' }
}

