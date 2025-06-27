"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function QuestionAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Question Info Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
          </div>
          
          {/* Question parts skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Camera Capture Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          {/* Camera/Upload buttons skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          
          {/* Helper text skeleton */}
          <Skeleton className="h-4 w-64 mx-auto mb-2" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </CardContent>
      </Card>

      {/* Submit Button Skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-11 w-48" />
      </div>
    </div>
  )
} 