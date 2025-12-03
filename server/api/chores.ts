// web/server/api/chores.ts
import { prisma } from '../db/client'
import { ChoreStatus, ChoreType, NotificationType } from '@prisma/client'
import { createNotification } from './notifications'
import { createChoreSchema } from '@/lib/validation/chore.schema'
import { AuthorizationError, AUTH_ERRORS } from '../auth/role'

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
  dueAt?: string | Date | null  // Accept string from datetime-local input
  createdById: string
}

/** ---------- Validation Helper ---------- */

/**
 * Validate input against a Zod schema and throw AuthorizationError if invalid
 */
function validateInput<T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: any } }, input: unknown): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new AuthorizationError(
      AUTH_ERRORS.INVALID_INPUT,
      JSON.stringify(parsed.error.flatten())
    )
  }
  return parsed.data as T
}

/** ---------- Helpers ---------- */

/**
 * Normalize dueAt value from various input formats to Date | null.
 * Handles:
 * - null/undefined → null
 * - Date object → Date
 * - String from <input type="datetime-local"> (e.g., "2025-12-04T16:47") → Date
 * - Full ISO string (e.g., "2025-12-04T16:47:00.000Z") → Date
 * - Invalid string → null
 */
function normalizeDueAt(dueAt: string | Date | null | undefined): Date | null {
  if (!dueAt) return null
  
  // If already a Date, return it
  if (dueAt instanceof Date) {
    return isNaN(dueAt.getTime()) ? null : dueAt
  }
  
  // If it's a string, parse it
  // datetime-local format: "2025-12-04T16:47"
  // This is valid input for new Date() constructor
  const parsed = new Date(dueAt)
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid dueAt value: "${dueAt}" - returning null`)
    return null
  }
  
  return parsed
}

/** ---------- Core helpers ---------- */

// Create a new chore
export async function createChore(input: CreateChoreInput) {
  // Validate input with Zod schema
  // Note: createdById is set by the caller (API route) from session, not validated here
  const validatedInput = validateInput(createChoreSchema, {
    title: input.title,
    description: input.description,
    type: input.type,
    category: input.category,
    budget: input.budget,
    imageUrl: input.imageUrl,
    locationAddress: input.locationAddress,
    locationLat: input.locationLat,
    locationLng: input.locationLng,
    dueAt: input.dueAt,
  })

  return prisma.chore.create({
    data: {
      title: validatedInput.title,
      description: validatedInput.description,
      type: validatedInput.type,
      status: ChoreStatus.PUBLISHED, // or DRAFT if you prefer
      category: validatedInput.category,
      budget: validatedInput.budget ?? null,
      imageUrl: validatedInput.imageUrl ?? null,
      locationAddress: validatedInput.locationAddress ?? null,
      locationLat: validatedInput.type === 'OFFLINE' ? validatedInput.locationLat ?? null : null,
      locationLng: validatedInput.type === 'OFFLINE' ? validatedInput.locationLng ?? null : null,
      dueAt: normalizeDueAt(validatedInput.dueAt),
      createdById: input.createdById, // Always from session, not validated input
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
      cancellationRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          requestedBy: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })
}

// List published chores with simple filters
export async function listPublishedChoresWithFilters(
  filters: { type?: ChoreType; location?: string; category?: string },
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

  // Filter by category (case-insensitive partial match)
  if (filters.category) {
    where.category = {
      contains: filters.category,
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

// Get all unique categories from published chores
export async function getUniqueCategories(): Promise<string[]> {
  const chores = await prisma.chore.findMany({
    where: { status: ChoreStatus.PUBLISHED },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  return chores.map((c) => c.category)
}

/** ---------- Status helpers (start / complete) ---------- */

/**
 * Mark chore as IN_PROGRESS
 * Security: Only the assigned worker can start the chore
 * @param choreId - The chore ID
 * @param workerId - Must be from session (not from client)
 */
export async function markChoreInProgress(choreId: string, workerId: string) {
  // Ensure chore exists
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      createdBy: {
        select: { id: true },
      },
    },
  })

  if (!chore) {
    throw new AuthorizationError(AUTH_ERRORS.NOT_FOUND, 'Chore not found')
  }

  // Security: Only the assigned worker can start
  if (chore.assignedWorkerId !== workerId) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN_OWNER,
      'You are not assigned to this chore'
    )
  }

  if (chore.status !== ChoreStatus.ASSIGNED) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN,
      'Chore must be ASSIGNED to start'
    )
  }

  const updatedChore = await prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.IN_PROGRESS },
  })

  // Notify the customer
  await createNotification({
    userId: chore.createdById,
    type: NotificationType.CHORE_STATUS_CHANGED,
    choreId: chore.id,
    title: 'Chore status updated',
    message: `"${chore.title}" is now IN_PROGRESS`,
    link: `/chores/${chore.id}`,
  })

  return updatedChore
}

/**
 * Mark chore as COMPLETED
 * Security: Only the assigned worker can complete the chore
 * @param choreId - The chore ID
 * @param workerId - Must be from session (not from client)
 */
export async function markChoreCompleted(choreId: string, workerId: string) {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      createdBy: {
        select: { id: true },
      },
    },
  })

  if (!chore) {
    throw new AuthorizationError(AUTH_ERRORS.NOT_FOUND, 'Chore not found')
  }

  // Security: Only the assigned worker can complete
  if (chore.assignedWorkerId !== workerId) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN_OWNER,
      'You are not assigned to this chore'
    )
  }

  if (
    chore.status !== ChoreStatus.IN_PROGRESS &&
    chore.status !== ChoreStatus.ASSIGNED
  ) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN,
      'Chore must be IN_PROGRESS or ASSIGNED to complete'
    )
  }

  const updatedChore = await prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.COMPLETED },
  })

  // Notify the customer
  await createNotification({
    userId: chore.createdById,
    type: NotificationType.CHORE_STATUS_CHANGED,
    choreId: chore.id,
    title: 'Chore status updated',
    message: `"${chore.title}" is now COMPLETED`,
    link: `/chores/${chore.id}`,
  })

  return updatedChore
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