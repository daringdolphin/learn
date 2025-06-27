/*
<ai_context>
Loading spinner component for showing loading states during async operations.
Helps provide good UX before potential errors occur.
</ai_context>
*/

"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  message?: string
  showMessage?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8"
}

export function LoadingSpinner({
  size = "md",
  className,
  message = "Loading...",
  showMessage = false
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      {showMessage && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  children,
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-md">
          <LoadingSpinner message={message} showMessage />
        </div>
      )}
    </div>
  )
} 