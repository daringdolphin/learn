/*
<ai_context>
Reusable error alert component for consistent error display across the app.
Supports different error types and retry functionality.
</ai_context>
*/

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { categorizeError, ErrorType, type ErrorInfo } from "@/lib/utils/error-handling"
import { AlertTriangle, RefreshCw, Wifi, WifiOff, X } from "lucide-react"
import { useState } from "react"

interface ErrorAlertProps {
  error: Error | string | ErrorInfo
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
  compact?: boolean
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className = "",
  showRetry = true,
  showDismiss = false,
  compact = false
}: ErrorAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  // Convert error to ErrorInfo if needed
  const errorInfo: ErrorInfo = (typeof error === 'object' && error !== null && 'type' in error) 
    ? error as ErrorInfo 
    : categorizeError(error)

  const handleRetry = async () => {
    if (!onRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  const getIcon = () => {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return WifiOff
      case ErrorType.TIMEOUT:
        return AlertTriangle
      default:
        return AlertTriangle
    }
  }

  const Icon = getIcon()

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm ${className}`}>
        <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
        <span className="text-red-800 flex-1">{errorInfo.message}</span>
        {showRetry && errorInfo.canRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-6 px-2 text-red-700 hover:text-red-900"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 px-2 text-red-700 hover:text-red-900"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Alert variant="destructive" className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {errorInfo.title}
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      
      <AlertDescription className="space-y-3">
        <p>{errorInfo.message}</p>
        
        {errorInfo.suggestion && (
          <p className="text-sm bg-red-100 p-2 rounded border-l-4 border-red-300">
            💡 <span className="font-medium">Tip:</span> {errorInfo.suggestion}
          </p>
        )}
        
        {(showRetry && errorInfo.canRetry && onRetry) && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface NetworkErrorAlertProps {
  isOnline: boolean
  onRetry?: () => void
  className?: string
}

export function NetworkErrorAlert({ isOnline, onRetry, className }: NetworkErrorAlertProps) {
  if (isOnline) return null

  return (
    <ErrorAlert
      error={{
        type: ErrorType.NETWORK,
        title: 'No Internet Connection',
        message: 'You appear to be offline. Please check your internet connection.',
        suggestion: 'Make sure you\'re connected to wifi or mobile data',
        canRetry: true,
        isUserError: false
      }}
      onRetry={onRetry}
      className={className}
    />
  )
} 