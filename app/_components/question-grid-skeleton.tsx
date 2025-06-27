"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface QuestionGridSkeletonProps {
  className?: string
}

export function QuestionGridSkeleton({ className }: QuestionGridSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar Skeleton */}
      <div className="relative max-w-md mx-auto">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Results Count Skeleton */}
      <div className="text-center">
        <Skeleton className="h-5 w-32 mx-auto" />
      </div>

      {/* Questions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Question Header Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>

            {/* Question Parts Skeleton */}
            <div className="mb-3">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Question Preview Skeleton */}
            <div className="mb-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>

            {/* Footer Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 