// web/server/notifications/index.ts
import { prisma } from '@/server/db/client'
import { sendExternalNotification, ExternalNotificationPayload } from './external'

export async function getUserNotificationPreferences(userId: string) {
  const prefs = await prisma.userNotificationPreference.findUnique({
    where: { userId },
  })
  if (prefs) return prefs
  // default preferences if not set
  return {
    email: true,
    sms: false,
    whatsapp: false,
    preferred: 'any',
    muteFrom: null,
    muteTo: null,
  }
}

export function isInMuteWindow(prefs: {
  muteFrom?: number | null
  muteTo?: number | null
}) {
  if (prefs.muteFrom == null || prefs.muteTo == null) return false
  const now = new Date()
  const hour = now.getHours()
  const from = prefs.muteFrom
  const to = prefs.muteTo
  if (from <= to) {
    return hour >= from && hour < to
  } else {
    // overnight window
    return hour >= from || hour < to
  }
}

/**
 * Convenience: call this after createNotification() so in-app notifications are created first.
 * Returns result of external send (or null if skipped).
 */
export async function maybeSendExternalNotification(
  payload: ExternalNotificationPayload
) {
  try {
    const prefs = await getUserNotificationPreferences(payload.userId)
    if (isInMuteWindow(prefs)) {
      // do not send external notifications during mute
      return { skipped: true, reason: 'muteWindow' }
    }

    // Decide channels allowed
    const allowedChannels: Record<string, boolean> = {
      email: !!prefs.email,
      sms: !!prefs.sms,
      whatsapp: !!prefs.whatsapp,
    }

    // If preferred is set, honor it first if available
    let chosenChannel: 'email' | 'sms' | 'whatsapp' | 'any' = 'any'
    if (prefs.preferred) {
      chosenChannel = prefs.preferred as any
      if (chosenChannel !== 'any' && !allowedChannels[chosenChannel]) {
        // preferred not allowed — fall back to any enabled channel
        chosenChannel = 'any'
      }
    }

    // If chosenChannel is 'any', decide the first available channel in order email -> whatsapp -> sms
    if (chosenChannel === 'any') {
      if (allowedChannels.email) chosenChannel = 'email'
      else if (allowedChannels.whatsapp) chosenChannel = 'whatsapp'
      else if (allowedChannels.sms) chosenChannel = 'sms'
      else {
        return { skipped: true, reason: 'no channel allowed' }
      }
    }

    // Fill payload.channel to chosen
    const sendPayload: ExternalNotificationPayload = {
      ...payload,
      channel: chosenChannel,
    }

    const result = await sendExternalNotification(sendPayload)
    return result
  } catch (err) {
    console.error('maybeSendExternalNotification error', err)
    return { ok: false, reason: String(err) }
  }
}

