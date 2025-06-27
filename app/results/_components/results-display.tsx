"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Share2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FeedbackTabs } from '@/components/feedback/feedback-tabs'
import { getAnalysisResult, removeAnalysisResult } from '@/lib/utils/storage'
import Link from 'next/link'
import type { Question, AnalysisResult } from '@/types'

interface ResultsDisplayProps {
  question: Question
}

export function ResultsDisplay({ question }: ResultsDisplayProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // Load results from localStorage
    const result = getAnalysisResult(question.id)
    setAnalysisResult(result)
    setLoading(false)
    
    // Set share URL
    setShareUrl(window.location.href)
  }, [question.id])

  const handleRetryAnalysis = () => {
    // Clear stored result and redirect to analysis page
    removeAnalysisResult(question.id)
    router.push(`/question/${question.id}`)
  }

  const handleShareResults = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chemistry Analysis Results - Question ${question.id.replace('q', '').replace(/^0+/, '')}`,
          text: 'Check out my chemistry exam analysis results',
          url: shareUrl
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  const handleDownload = () => {
    // Create a printable version
    window.print()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">No Results Found</h2>
          <p className="text-gray-600">
            No analysis results were found for this question. 
            This might be because the results have expired or were cleared.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href={`/question/${question.id}`}>
              Analyze This Question
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>
      </div>

      {/* Question Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Results - Question {question.id.replace('q', '').replace(/^0+/, '')}</span>
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              {question.marks} marks
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackTabs analysisResult={analysisResult} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t">
        <Button asChild size="lg">
          <Link href="/">
            Analyze Another Question
          </Link>
        </Button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
} 