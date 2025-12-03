/**
 * Zod validation schemas for Application-related inputs
 */
import { z } from 'zod'

/**
 * Schema for creating a new application (worker applying to a chore)
 * Note: workerId is set server-side from session, not from input
 */
export const createApplicationSchema = z.object({
  choreId: z
    .string()
    .min(1, 'Chore ID is required')
    .max(50, 'Invalid chore ID'),
  
  bidAmount: z
    .number()
    .int('Bid amount must be a whole number')
    .positive('Bid amount must be positive')
    .max(1000000, 'Bid amount is too high')
    .nullable()
    .optional(),
  
  message: z
    .string()
    .max(2000, 'Message cannot exceed 2000 characters')
    .nullable()
    .optional(),
})

/**
 * Schema for assigning an application (customer accepting a worker)
 */
export const assignApplicationSchema = z.object({
  applicationId: z
    .string()
    .min(1, 'Application ID is required')
    .max(50, 'Invalid application ID'),
})

// Type exports for use in server functions
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type AssignApplicationInput = z.infer<typeof assignApplicationSchema>

