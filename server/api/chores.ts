// web/server/api/chores.ts
import { prisma } from '../db/client'
import { ChoreStatus, ChoreType } from '@prisma/client'

/** ---------- Types ---------- */

export interface CreateChoreInput {
  title: string
  description: string
  type: ChoreType
  category: string
  budget?: number | null
  imageUrl?: string | null
  locationAddress?: string | null
  locationLat?: number | null
  locationLng?: number | null
  dueAt?: Date | null
  createdById: string
}

/** ---------- Core helpers ---------- */

// Create a new chore
export async function createChore(input: CreateChoreInput) {
  return prisma.chore.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      status: ChoreStatus.PUBLISHED, // or DRAFT if you prefer
      category: input.category,
      budget: input.budget ?? null,
      imageUrl: input.imageUrl ?? null,
      locationAddress: input.locationAddress ?? null,
      locationLat: input.type === 'OFFLINE' ? input.locationLat ?? null : null,
      locationLng: input.type === 'OFFLINE' ? input.locationLng ?? null : null,
      dueAt: input.dueAt ?? null,
      createdById: input.createdById,
    },
  })
}

// Get a single chore with relations for the detail page
export async function getChoreById(id: string) {
  return prisma.chore.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      assignedWorker: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { applications: true },
      },
      ratings: {
        include: {
          fromUser: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// List published chores with simple filters
export async function listPublishedChoresWithFilters(
  filters: { type?: ChoreType; location?: string },
  excludeUserId?: string,
) {
  const where: any = {
    status: ChoreStatus.PUBLISHED,
  }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.location) {
    where.locationAddress = {
      contains: filters.location,
      mode: 'insensitive',
    }
  }

  if (excludeUserId) {
    where.createdById = {
      not: excludeUserId,
    }
  }

  const chores = await prisma.chore.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return chores
}

/** ---------- Status helpers (start / complete) ---------- */

export async function markChoreInProgress(choreId: string, workerId: string) {
  // Ensure chore exists and is assigned to this worker
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.assignedWorkerId !== workerId) {
    throw new Error('You are not assigned to this chore')
  }

  if (chore.status !== ChoreStatus.ASSIGNED) {
    throw new Error('Chore must be ASSIGNED to start')
  }

  return prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.IN_PROGRESS },
  })
}

export async function markChoreCompleted(choreId: string, workerId: string) {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.assignedWorkerId !== workerId) {
    throw new Error('You are not assigned to this chore')
  }

  if (
    chore.status !== ChoreStatus.IN_PROGRESS &&
    chore.status !== ChoreStatus.ASSIGNED
  ) {
    throw new Error('Chore must be IN_PROGRESS or ASSIGNED to complete')
  }

  return prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.COMPLETED },
  })
}

/** ---------- Distance helpers ---------- */

// Haversine distance in km
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Server-side distance filter for workers
export async function getChoresWithinDistance(
  workerLat: number,
  workerLng: number,
  radiusKm: number,
  excludeUserId?: string,
) {
  const where: any = {
    status: ChoreStatus.PUBLISHED,
    type: ChoreType.OFFLINE,
    locationLat: { not: null },
    locationLng: { not: null },
  }

  if (excludeUserId) {
    where.createdById = { not: excludeUserId }
  }

  const allChores = await prisma.chore.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
  })

  const choresWithDistance = allChores
    .map((chore) => {
      if (chore.locationLat == null || chore.locationLng == null) {
        return null
      }
      const distance = haversineDistance(
        workerLat,
        workerLng,
        chore.locationLat,
        chore.locationLng,
      )
      return { ...chore, distance }
    })
    .filter(
      (chore): chore is typeof allChores[number] & { distance: number } =>
        chore !== null && chore.distance <= radiusKm,
    )
    .sort((a, b) => a.distance - b.distance)

  return choresWithDistance
}

// Convenience wrapper for “nearby offline chores”
export async function listNearbyOfflineChores(
  workerLat: number,
  workerLng: number,
  radiusKm: number,
  excludeUserId?: string,
) {
  return getChoresWithinDistance(workerLat, workerLng, radiusKm, excludeUserId)
}