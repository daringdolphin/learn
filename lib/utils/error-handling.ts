/*
<ai_context>
Error handling utilities for the chemistry exam analysis app.
Provides consistent error categorization and user-friendly error messages.
</ai_context>
*/

export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  INVALID_IMAGE = 'invalid_image',
  UNREADABLE_HANDWRITING = 'unreadable_handwriting',
  API_ERROR = 'api_error',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export interface ErrorInfo {
  type: ErrorType
  title: string
  message: string
  suggestion?: string
  canRetry: boolean
  isUserError: boolean
}

/**
 * Categorizes an error and returns user-friendly information
 */
export function categorizeError(error: Error | string): ErrorInfo {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  // Network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') || 
      lowerMessage.includes('connection') ||
      lowerMessage.includes('offline')) {
    return {
      type: ErrorType.NETWORK,
      title: 'Connection Problem',
      message: 'Please check your internet connection and try again.',
      suggestion: 'Make sure you\'re connected to the internet',
      canRetry: true,
      isUserError: false
    }
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || 
      lowerMessage.includes('timed out') ||
      lowerMessage.includes('504')) {
    return {
      type: ErrorType.TIMEOUT,
      title: 'Request Timed Out',
      message: 'The analysis is taking longer than expected. Please try again.',
      suggestion: 'This usually happens with very complex images or during high server load',
      canRetry: true,
      isUserError: false
    }
  }

  // Invalid image errors
  if (lowerMessage.includes('image') || 
      lowerMessage.includes('file format') || 
      lowerMessage.includes('invalid format') ||
      lowerMessage.includes('file size') ||
      lowerMessage.includes('unsupported')) {
    return {
      type: ErrorType.INVALID_IMAGE,
      title: 'Invalid Image',
      message: 'Please upload a clear image in PNG or JPEG format (max 10MB).',
      suggestion: 'Make sure your image is clear, well-lit, and under 10MB',
      canRetry: true,
      isUserError: true
    }
  }

  // Unreadable handwriting errors
  if (lowerMessage.includes('handwriting') || 
      lowerMessage.includes('unclear') || 
      lowerMessage.includes('unreadable') ||
      lowerMessage.includes('read clearly') ||
      lowerMessage.includes('422')) {
    return {
      type: ErrorType.UNREADABLE_HANDWRITING,
      title: 'Handwriting Unclear',
      message: 'Unable to read the handwriting clearly. Please try with a clearer image.',
      suggestion: 'Try taking the photo in better lighting or write more clearly',
      canRetry: true,
      isUserError: true
    }
  }

  // API errors
  if (lowerMessage.includes('api') || 
      lowerMessage.includes('server') ||
      lowerMessage.includes('400') ||
      lowerMessage.includes('500') ||
      lowerMessage.includes('503')) {
    return {
      type: ErrorType.API_ERROR,
      title: 'Service Temporarily Unavailable',
      message: 'Our service is temporarily unavailable. Please try again in a moment.',
      suggestion: 'If this persists, our servers might be experiencing high load',
      canRetry: true,
      isUserError: false
    }
  }

  // Validation errors
  if (lowerMessage.includes('validation') || 
      lowerMessage.includes('required') ||
      lowerMessage.includes('missing') ||
      lowerMessage.includes('invalid')) {
    return {
      type: ErrorType.VALIDATION,
      title: 'Input Error',
      message: 'Please check your input and try again.',
      suggestion: 'Make sure all required fields are filled correctly',
      canRetry: true,
      isUserError: true
    }
  }

  // Generic unknown error
  return {
    type: ErrorType.UNKNOWN,
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    suggestion: 'If this continues, try refreshing the page',
    canRetry: true,
    isUserError: false
  }
}

/**
 * Checks if the user is currently online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Sets up online/offline event listeners
 */
export function setupNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {} // No-op for server-side
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

/**
 * Logs errors appropriately based on environment
 */
export function logError(error: Error | string, context?: string): void {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Error'}]`, errorMessage)
    if (errorStack) {
      console.error('Stack trace:', errorStack)
    }
  } else {
    // In production, you might want to send to an error tracking service
    console.error(`[${context || 'Error'}]`, errorMessage)
    
    // Example: Send to error tracking service
    // if (typeof window !== 'undefined' && window.errorTracker) {
    //   window.errorTracker.captureException(error, { context })
    // }
  }
}

/**
 * Creates a standardized error object for API responses
 */
export function createErrorResponse(
  error: Error | string,
  statusCode: number = 500
): { error: string; message: string; statusCode: number } {
  const errorInfo = categorizeError(error)
  
  return {
    error: errorInfo.type,
    message: errorInfo.message,
    statusCode
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        break
      }

      // Don't retry on user errors (4xx status codes)
      const errorInfo = categorizeError(lastError)
      if (errorInfo.isUserError) {
        break
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
} 