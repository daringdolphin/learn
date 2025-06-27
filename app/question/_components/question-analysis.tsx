"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CameraCapture } from '@/components/camera/camera-capture'
import { saveAnalysisResult } from '@/lib/utils/storage'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useErrorBoundary } from '@/lib/hooks/use-error-boundary'
import { retryWithBackoff } from '@/lib/utils/error-handling'
import Link from 'next/link'
import type { Question, AnalysisResult } from '@/types'

interface QuestionAnalysisProps {
  question: Question
}

export function QuestionAnalysis({ question }: QuestionAnalysisProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const { error, hasError, resetError, captureError } = useErrorBoundary()
  const router = useRouter()

  const handleImageCapture = (file: File) => {
    setSelectedFile(file)
    resetError()
  }

  const handleImageRemove = () => {
    setSelectedFile(null)
    resetError()
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      captureError('Please capture or upload an image of your answer sheet', 'File validation')
      return
    }

    setIsAnalyzing(true)
    resetError()
    setTimeoutWarning(false)

    // Show timeout warning after 60 seconds
    const timeoutTimer = setTimeout(() => {
      setTimeoutWarning(true)
    }, 60000)

    try {
      const formData = new FormData()
      formData.append('questionId', question.id)
      formData.append('image', selectedFile)

      const response = await fetch('/api/analyze-answer', {
        method: 'POST',
        body: formData,
      })

      clearTimeout(timeoutTimer)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 422) {
          throw new Error('Unable to read handwriting clearly. Please try again with a clearer image.')
        } else if (response.status === 504) {
          throw new Error('Analysis timed out. Please try again.')
        } else {
          throw new Error(errorData.message || 'Analysis failed. Please try again.')
        }
      }

      const analysisResult: AnalysisResult = await response.json()
      
      // Save result to localStorage
      const saved = saveAnalysisResult(question.id, analysisResult)
      if (!saved) {
        console.warn('Failed to save analysis result to localStorage')
      }

      // Redirect to results page
      router.push(`/results/${question.id}`)

    } catch (error) {
      clearTimeout(timeoutTimer)
      captureError(error instanceof Error ? error : new Error(String(error)), 'Analysis request')
    } finally {
      setIsAnalyzing(false)
      setTimeoutWarning(false)
    }
  }

  const getQuestionSummary = () => {
    const parts = question.modelAnswerJson.map(p => {
      if (p.subpart) {
        return `${p.part}(${p.subpart})`
      }
      return p.part
    })
    return parts.join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
      </div>

      {/* Question Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {question.id.replace('q', '').replace(/^0+/, '')}</span>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              {question.marks} marks
            </span>
          </CardTitle>
        </CardHeader>
        
      </Card>

      {/* Camera Capture */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Answer Sheet</CardTitle>
          <p className="text-sm text-gray-600">
            Take a photo or upload an image of your completed answer sheet for this question.
          </p>
        </CardHeader>
        <CardContent>
          <CameraCapture
            onImageCapture={handleImageCapture}
            onImageRemove={handleImageRemove}
            disabled={isAnalyzing}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {hasError && error && (
        <ErrorAlert
          error={error}
          onRetry={resetError}
          showRetry={error.canRetry}
        />
      )}

      {/* Timeout Warning */}
      {timeoutWarning && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Analysis is taking longer than usual. Please wait, it should complete soon.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || isAnalyzing}
          size="lg"
          className="min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Analyze Answer
            </>
          )}
        </Button>
      </div>

      {/* Processing Info */}
      {isAnalyzing && (
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>AI is analyzing your answer against the model solution...</p>
          <p>This may take up to 2 minutes.</p>
        </div>
      )}
    </div>
  )
} 