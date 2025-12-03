import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const prefs = await prisma.userNotificationPreference.findUnique({
    where: { userId: user.id },
  })
  return new Response(JSON.stringify(prefs ?? {}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const body = await req.json()
  const data = {
    email: !!body.email,
    sms: !!body.sms,
    whatsapp: !!body.whatsapp,
    preferred: body.preferred || null,
    muteFrom: body.muteFrom ?? null,
    muteTo: body.muteTo ?? null,
  }
  await prisma.userNotificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

