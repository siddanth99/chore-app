/**
 * Image Upload Validation Utilities
 * 
 * Centralized validation for image uploads used across:
 * - /api/upload (server-side)
 * - Chore form (client-side)
 * - Profile avatar (client-side)
 * 
 * Ready for S3/Cloudinary integration in the future.
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed MIME types for image uploads
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * Maximum URL length for stored image URLs
 */
export const MAX_IMAGE_URL_LENGTH = 500

/**
 * Human-readable size limit for error messages
 */
export const MAX_IMAGE_SIZE_DISPLAY = '5MB'

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a MIME type is allowed for image uploads
 */
export function isAllowedImageType(mime: string | null | undefined): boolean {
  if (!mime) return false
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime)
}

/**
 * Check if a file size is within allowed limits
 */
export function isAllowedImageSize(size: number | null | undefined): boolean {
  if (size === null || size === undefined || size <= 0) return false
  return size <= MAX_IMAGE_SIZE_BYTES
}

/**
 * Validate an image file (client-side or server-side)
 * @returns null if valid, error message string if invalid
 */
export function validateImageFile(file: { type: string; size: number } | null | undefined): string | null {
  if (!file) {
    return 'No file provided'
  }

  if (!isAllowedImageType(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
  }

  if (!isAllowedImageSize(file.size)) {
    return `File size exceeds ${MAX_IMAGE_SIZE_DISPLAY} limit.`
  }

  return null // Valid
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mime: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return mimeToExt[mime] || 'jpg'
}

/**
 * Check if a string is a valid image URL (basic validation)
 * For data URLs (base64), checks if it starts with 'data:image/'
 * For regular URLs, checks basic URL structure
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  
  // Data URL validation
  if (url.startsWith('data:')) {
    return url.startsWith('data:image/')
  }
  
  // Regular URL validation (basic check)
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    // Relative URLs (e.g., /uploads/image.jpg) are also valid
    return url.startsWith('/')
  }
}

/**
 * Check if a URL is a data URL (base64 encoded)
 */
export function isDataUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('data:')
}

// ============================================================================
// Error Messages
// ============================================================================

export const IMAGE_VALIDATION_ERRORS = {
  NO_FILE: 'No file provided',
  INVALID_TYPE: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
  TOO_LARGE: `File size exceeds ${MAX_IMAGE_SIZE_DISPLAY} limit.`,
  UPLOAD_FAILED: 'Failed to upload image. Please try again.',
} as const

