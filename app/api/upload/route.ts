import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { requireAuth, isAuthError, getHttpStatusForAuthError } from '@/server/auth/role'
import {
  isAllowedImageType,
  isAllowedImageSize,
  getExtensionFromMime,
  IMAGE_VALIDATION_ERRORS,
  MAX_IMAGE_SIZE_DISPLAY,
} from '@/lib/validation/image'
import { fileUploadLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

/**
 * POST /api/upload
 * 
 * Secure image upload endpoint.
 * 
 * Security:
 * - Requires authentication
 * - Validates MIME type (JPEG, PNG, WebP only)
 * - Enforces 5MB size limit
 * - Generates safe random filenames (no user-controlled names)
 * 
 * TODO: Replace local storage with S3/Cloudinary for production
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Require authentication
    const user = await requireAuth()

    // Rate limiting: Prevent storage abuse
    const rateLimitKey = getRateLimitKey(request, user.id)
    const { success, reset } = await fileUploadLimiter.limit(rateLimitKey)
    
    if (!success) {
      return NextResponse.json(
        createRateLimitResponse(reset, 'Too many uploads. Please try again later.'),
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: IMAGE_VALIDATION_ERRORS.NO_FILE },
        { status: 400 }
      )
    }

    // Security: Validate file type (MIME type check)
    // Note: MIME types can be spoofed, but this is a first line of defense.
    // For production, consider additional validation (magic bytes, re-encoding).
    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        { error: IMAGE_VALIDATION_ERRORS.INVALID_TYPE },
        { status: 400 }
      )
    }

    // Security: Validate file size (5MB limit)
    if (!isAllowedImageSize(file.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMAGE_SIZE_DISPLAY}.` },
        { status: 413 } // 413 Payload Too Large
      )
    }

    // Security: Generate safe filename using UUID (never trust user-provided filenames)
    const fileExtension = getExtensionFromMime(file.type)
    const filename = `${randomUUID()}.${fileExtension}`
    
    // Ensure uploads directory exists
    // TODO: Replace with S3/Cloudinary upload for production
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)
    
    await writeFile(filepath, buffer)

    // Return public URL
    const url = `/uploads/${filename}`
    
    return NextResponse.json({ url }, { status: 200 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    
    // Handle auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Authentication required' },
        { status }
      )
    }
    
    // Generic error (don't leak details)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

