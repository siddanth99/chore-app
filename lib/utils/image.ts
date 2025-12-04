/**
 * Client-side image compression utility
 * Compresses images to base64 JPEG strings for efficient storage and transmission
 */

/**
 * Compress an image file to a base64 JPEG string
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels (default 800)
 * @param quality - JPEG quality 0-1 (default 0.6)
 * @param maxSizeKB - Target maximum size in KB (default 300)
 * @returns Compressed base64 string or null if compression fails
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.6,
  maxSizeKB = 300
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    let objectUrl: string | null = null

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down maintaining aspect ratio
        if (width > maxWidth) {
          const ratio = maxWidth / width
          width = maxWidth
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          if (objectUrl) URL.revokeObjectURL(objectUrl)
          resolve(null)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compress with quality adjustment to meet size target
        const compressWithQuality = (q: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                if (objectUrl) URL.revokeObjectURL(objectUrl)
                resolve(null)
                return
              }

              const sizeKB = blob.size / 1024
              
              // If size is acceptable or we've reached minimum quality, use it
              if (sizeKB <= maxSizeKB || q <= 0.3) {
                const reader = new FileReader()
                reader.onloadend = () => {
                  if (objectUrl) URL.revokeObjectURL(objectUrl)
                  const base64 = reader.result as string
                  resolve(base64)
                }
                reader.onerror = () => {
                  if (objectUrl) URL.revokeObjectURL(objectUrl)
                  resolve(null)
                }
                reader.readAsDataURL(blob)
              } else {
                // Try lower quality
                compressWithQuality(Math.max(0.3, q - 0.1))
              }
            },
            'image/jpeg',
            q
          )
        }

        compressWithQuality(quality)
      } catch (error) {
        console.error('Image compression error:', error)
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        resolve(null)
      }
    }

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve(null)
    }

    objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
}

