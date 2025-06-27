import sharp from 'sharp'

export interface ProcessedImage {
  dataUrl: string
  mimeType: string
  size: number
  width: number
  height: number
}

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed MIME types for uploaded images
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png'
] as const

/**
 * Processes an uploaded image file for analysis
 * - Validates file type and size
 * - Auto-rotates based on EXIF orientation
 * - Converts to base64 data URL
 * 
 * @param file - The uploaded image file
 * @returns Promise resolving to processed image data
 */
export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    throw new Error(`Invalid file type: ${file.type}. Only JPEG and PNG are supported.`)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size too large: ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`)
  }

  if (file.size === 0) {
    throw new Error('File is empty.')
  }

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process the image with Sharp
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .jpeg({ quality: 90 }) // Convert to JPEG with high quality for consistency
      .toBuffer({ resolveWithObject: true })

    const { data, info } = processedBuffer

    // Validate processed image dimensions
    if (info.width < 100 || info.height < 100) {
      throw new Error('Image dimensions too small. Minimum size is 100x100 pixels.')
    }

    if (info.width > 4096 || info.height > 4096) {
      throw new Error('Image dimensions too large. Maximum size is 4096x4096 pixels.')
    }

    // Convert to base64 data URL
    const base64 = data.toString('base64')
    const mimeType = 'image/jpeg' // Always JPEG after Sharp processing
    const dataUrl = `data:${mimeType};base64,${base64}`

    return {
      dataUrl,
      mimeType,
      size: data.length,
      width: info.width,
      height: info.height
    }

  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our own validation errors
      if (error.message.includes('Invalid file type') || 
          error.message.includes('File size too large') ||
          error.message.includes('File is empty') ||
          error.message.includes('Image dimensions')) {
        throw error
      }
    }

    // Handle Sharp-specific errors
    if (error instanceof Error && error.message.includes('Input file contains unsupported image format')) {
      throw new Error('Unsupported or corrupted image format. Please upload a valid JPEG or PNG file.')
    }

    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates if a file is a supported image type
 * @param file - The file to validate
 * @returns boolean indicating if the file type is supported
 */
export function isValidImageType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type as any)
}

/**
 * Validates if a file size is within limits
 * @param size - File size in bytes
 * @returns boolean indicating if the size is acceptable
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * Gets the MIME type from a file extension
 * @param filename - The filename to check
 * @returns MIME type or null if not supported
 */
export function getMimeTypeFromExtension(filename: string): string | null {
  const extension = filename.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    default:
      return null
  }
}

/**
 * Formats file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validates image dimensions
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns boolean indicating if dimensions are acceptable
 */
export function isValidImageDimensions(width: number, height: number): boolean {
  const MIN_DIMENSION = 100
  const MAX_DIMENSION = 4096
  
  return width >= MIN_DIMENSION && 
         height >= MIN_DIMENSION && 
         width <= MAX_DIMENSION && 
         height <= MAX_DIMENSION
}

/**
 * Creates a data URL from buffer and MIME type
 * @param buffer - Image buffer
 * @param mimeType - MIME type of the image
 * @returns Data URL string
 */
export function createDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
} 