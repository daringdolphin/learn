/*
<ai_context>
Custom hook for error boundary functionality.
Allows components to handle errors gracefully and provide user-friendly error states.
</ai_context>
*/

import { useCallback, useState } from 'react'
import { categorizeError, logError, type ErrorInfo } from '@/lib/utils/error-handling'

interface UseErrorBoundaryReturn {
  error: ErrorInfo | null
  hasError: boolean
  resetError: () => void
  captureError: (error: Error | string, context?: string) => void
}

/**
 * Custom hook for handling errors in React components
 * Provides error state management and user-friendly error information
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<ErrorInfo | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const captureError = useCallback((error: Error | string, context?: string) => {
    // Log the error
    logError(error, context)
    
    // Categorize and set the error for display
    const errorInfo = categorizeError(error)
    setError(errorInfo)
  }, [])

  return {
    error,
    hasError: error !== null,
    resetError,
    captureError
  }
}

/**
 * Higher-order component for adding error boundary functionality
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: ErrorInfo; resetError: () => void }>
) {
  return function WithErrorBoundaryComponent(props: P) {
    const { error, hasError, resetError, captureError } = useErrorBoundary()

    // Provide error capture function to child components
    const enhancedProps = {
      ...props,
      onError: captureError
    } as P & { onError: (error: Error | string, context?: string) => void }

    if (hasError && error) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent
        return <FallbackComponent error={error} resetError={resetError} />
      }

      // Default fallback UI
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {error.title}
          </h3>
          <p className="text-red-700 mb-3">{error.message}</p>
          {error.suggestion && (
            <p className="text-sm text-red-600 mb-3">💡 {error.suggestion}</p>
          )}
          {error.canRetry && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )
    }

    return <WrappedComponent {...enhancedProps} />
  }
} 