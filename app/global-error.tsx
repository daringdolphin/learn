"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error to console
    console.error('Global Error:', error)
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error)
    }
  }, [error])

  const isCriticalError = () => {
    const message = error.message.toLowerCase()
    return (
      message.includes('chunk') ||
      message.includes('loading') ||
      message.includes('hydration') ||
      message.includes('render')
    )
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Application Error
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Error Detected</AlertTitle>
                <AlertDescription>
                  {isCriticalError() 
                    ? "A critical application error has occurred. This might be due to a temporary loading issue."
                    : "An unexpected error has occurred in the application."
                  }
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  We apologize for the inconvenience. Please try one of the following options:
                </p>
                
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Refresh the page to reload the application</li>
                  <li>• Return to the home page</li>
                  <li>• Clear your browser cache if the problem persists</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleReload}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleGoHome}
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={reset}
                  className="w-full"
                  size="sm"
                >
                  Try to Recover
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  If this problem continues, please try clearing your browser cache or contact support.
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <summary className="cursor-pointer text-red-700 font-medium">
                    Debug Information (Development Only)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <strong className="text-red-800">Error Message:</strong>
                      <p className="text-red-700 font-mono text-sm">{error.message}</p>
                    </div>
                    {error.digest && (
                      <div>
                        <strong className="text-red-800">Error Digest:</strong>
                        <p className="text-red-700 font-mono text-sm">{error.digest}</p>
                      </div>
                    )}
                    <div>
                      <strong className="text-red-800">Stack Trace:</strong>
                      <pre className="text-red-700 font-mono text-xs whitespace-pre-wrap bg-red-100 p-2 rounded mt-1 max-h-40 overflow-auto">
                        {error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
} 