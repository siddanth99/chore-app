/**
 * Zod validation schemas for Profile-related inputs
 */
import { z } from 'zod'

/**
 * Schema for updating user profile
 * All fields are optional (partial update)
 * Note: userId is always taken from session, never from input
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters')
    .optional(),
  
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .nullable()
    .optional(),
  
  phone: z
    .string()
    .regex(
      /^[\d\s\-\+\(\)]{7,20}$/,
      'Invalid phone number format'
    )
    .nullable()
    .optional()
    .or(z.literal('')), // Allow empty string which we'll convert to null
  
  baseLocation: z
    .string()
    .max(200, 'Location cannot exceed 200 characters')
    .nullable()
    .optional(),
  
  skills: z
    .array(
      z.string().min(1, 'Skill cannot be empty').max(50, 'Skill name too long')
    )
    .max(20, 'Cannot have more than 20 skills')
    .optional(),
  
  hourlyRate: z
    .number()
    .int('Hourly rate must be a whole number')
    .min(0, 'Hourly rate cannot be negative')
    .max(10000, 'Hourly rate is too high')
    .nullable()
    .optional(),
  
  avatarUrl: z
    .string()
    .max(5000, 'Avatar URL is too long') // Data URLs can be long
    .nullable()
    .optional(),
})

// Type export for use in server functions
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

