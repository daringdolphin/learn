import sharp from 'sharp'
import { OPENAI_CONFIG } from '@/lib/config/openai-config'

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

/**
 * Optimizes an image for OpenAI reference use by compressing and resizing
 * @param imageBuffer - The image buffer to optimize
 * @param maxWidth - Maximum width for the optimized image (default: 1024)
 * @param quality - JPEG quality (default: 60 for reference images)
 * @returns Promise resolving to optimized image data URL
 */
export async function optimizeImageForOpenAI(
  imageBuffer: Buffer, 
  maxWidth: number = 1024, 
  quality: number = 60
): Promise<string> {
  try {
    // Process the image with Sharp for optimization
    const processedBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(maxWidth, null, { 
        withoutEnlargement: true, // Don't upscale small images
        fit: 'inside' // Maintain aspect ratio
      })
      .jpeg({ 
        quality,
        progressive: true,
        optimizeScans: true
      })
      .toBuffer()

    // Convert to base64 data URL
    const base64 = processedBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    return dataUrl

  } catch (error) {
    throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Downloads and optimizes an image from a URL for OpenAI
 * @param url - The image URL to download and optimize
 * @param maxWidth - Maximum width for the optimized image (default: 1024)
 * @param quality - JPEG quality (default: 60 for reference images)
 * @returns Promise resolving to optimized image data URL or null if failed
 */
export async function downloadAndOptimizeImage(
  url: string, 
  maxWidth: number = OPENAI_CONFIG.REFERENCE_IMAGE_MAX_WIDTH, 
  quality: number = OPENAI_CONFIG.REFERENCE_IMAGE_QUALITY
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_CONFIG.DOWNLOAD_TIMEOUT)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FeedbackApp/1.0)',
        'Accept': 'image/*'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`Failed to download image ${url}: ${response.status} ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`Invalid content type for ${url}: ${contentType}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize the downloaded image
    const optimizedDataUrl = await optimizeImageForOpenAI(buffer, maxWidth, quality)

    console.log(`✓ Downloaded and optimized image: ${url} (${Math.round(arrayBuffer.byteLength / 1024)}KB → ${Math.round(Buffer.from(optimizedDataUrl.split(',')[1], 'base64').length / 1024)}KB)`)
    return optimizedDataUrl

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Download timeout for image: ${url}`)
    } else {
      console.warn(`Failed to download and optimize image ${url}:`, error)
    }
    return null
  }
} 