/**
 * Zod validation schemas for Chore-related inputs
 */
import { z } from 'zod'
import { ChoreType, ChoreStatus } from '@prisma/client'

/**
 * Schema for creating a new chore
 * Validates all required fields and optional fields with appropriate constraints
 */
export const createChoreSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description cannot exceed 4000 characters'),
  
  type: z.nativeEnum(ChoreType, {
    message: 'Type must be ONLINE or OFFLINE',
  }),
  
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(80, 'Category cannot exceed 80 characters'),
  
  budget: z
    .number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .nullable()
    .optional(),
  
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .max(500, 'Image URL is too long')
    .nullable()
    .optional(),
  
  locationAddress: z
    .string()
    .max(200, 'Location address cannot exceed 200 characters')
    .nullable()
    .optional(),
  
  locationLat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .nullable()
    .optional(),
  
  locationLng: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .nullable()
    .optional(),
  
  // dueAt comes as string from datetime-local input, normalized server-side
  dueAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date format' }
    ),
}).refine(
  (data) => {
    // OFFLINE chores must have location coordinates
    if (data.type === ChoreType.OFFLINE) {
      return data.locationLat !== null && 
             data.locationLat !== undefined && 
             data.locationLng !== null && 
             data.locationLng !== undefined
    }
    return true
  },
  {
    message: 'OFFLINE chores require location coordinates (latitude and longitude)',
    path: ['locationLat'],
  }
)

/**
 * Schema for updating an existing chore
 * All fields are optional (partial update)
 */
export const updateChoreSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .optional(),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description cannot exceed 4000 characters')
    .optional(),
  
  type: z.nativeEnum(ChoreType).optional(),
  
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(80, 'Category cannot exceed 80 characters')
    .optional(),
  
  budget: z
    .number()
    .int('Budget must be a whole number')
    .positive('Budget must be positive')
    .nullable()
    .optional(),
  
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .max(500, 'Image URL is too long')
    .nullable()
    .optional(),
  
  locationAddress: z
    .string()
    .max(200, 'Location address cannot exceed 200 characters')
    .nullable()
    .optional(),
  
  locationLat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .nullable()
    .optional(),
  
  locationLng: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .nullable()
    .optional(),
  
  dueAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Invalid date format' }
    ),
})

// Type exports for use in server functions
export type CreateChoreInput = z.infer<typeof createChoreSchema>
export type UpdateChoreInput = z.infer<typeof updateChoreSchema>

