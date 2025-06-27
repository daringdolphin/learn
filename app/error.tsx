"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Route Error:', error)
    }

    // Check network status
    const updateNetworkStatus = () => setIsOnline(navigator.onLine)
    updateNetworkStatus()
    
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [error])

  const getErrorInfo = () => {
    const message = error.message.toLowerCase()
    
    // Network failures
    if (!isOnline || message.includes('network') || message.includes('fetch')) {
      return {
        title: "Connection Problem",
        description: "Please check your internet connection and try again.",
        icon: WifiOff,
        canRetry: true,
        suggestion: "Make sure you're connected to the internet"
      }
    }
    
    // API timeouts (120s limit)
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        title: "Request Timed Out",
        description: "The analysis is taking longer than expected. Please try again.",
        icon: AlertTriangle,
        canRetry: true,
        suggestion: "This usually happens with very complex images"
      }
    }
    
    // Invalid image formats
    if (message.includes('image') || message.includes('file format') || message.includes('invalid')) {
      return {
        title: "Invalid Image",
        description: "Please upload a clear image in PNG or JPEG format (max 10MB).",
        icon: AlertTriangle,
        canRetry: true,
        suggestion: "Make sure your image is clear and under 10MB"
      }
    }
    
    // Unreadable handwriting
    if (message.includes('handwriting') || message.includes('unclear') || message.includes('read')) {
      return {
        title: "Handwriting Unclear",
        description: "Unable to read the handwriting clearly. Please try with a clearer image.",
        icon: AlertTriangle,
        canRetry: true,
        suggestion: "Try taking the photo in better lighting"
      }
    }
    
    // Generic error
    return {
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Please try again.",
      icon: AlertTriangle,
      canRetry: true,
      suggestion: "If this continues, try refreshing the page"
    }
  }

  const errorInfo = getErrorInfo()
  const Icon = errorInfo.icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              {errorInfo.description}
            </AlertDescription>
          </Alert>
          
          {errorInfo.suggestion && (
            <p className="text-sm text-gray-600 text-center">
              💡 {errorInfo.suggestion}
            </p>
          )}
          
          {!isOnline && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>No Internet Connection</AlertTitle>
              <AlertDescription>
                You appear to be offline. Please check your connection.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            {errorInfo.canRetry && (
              <Button 
                onClick={reset}
                className="w-full"
                disabled={!isOnline}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <summary className="cursor-pointer text-gray-600">
                Debug Info (Development Only)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-red-600">
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 