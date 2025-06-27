"use client"

import { useState } from 'react'
import { Search, FileText, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Question } from '@/types'

interface QuestionGridProps {
  questions: Question[]
  className?: string
}

export function QuestionGrid({ questions, className }: QuestionGridProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter questions based on search query
  const filteredQuestions = questions.filter(question => {
    const searchLower = searchQuery.toLowerCase()
    return (
      question.id.toLowerCase().includes(searchLower) ||
      question.modelAnswerJson.some(part => 
        part.questionText.toLowerCase().includes(searchLower) ||
        part.part.toLowerCase().includes(searchLower)
      )
    )
  })

  const getQuestionSummary = (question: Question) => {
    const parts = question.modelAnswerJson.map(p => {
      if (p.subpart) {
        return `${p.part}(${p.subpart})`
      }
      return p.part
    })
    return parts.join(', ')
  }

  const getQuestionPreview = (question: Question) => {
    const firstPart = question.modelAnswerJson[0]
    if (firstPart?.questionText) {
      return firstPart.questionText.length > 100 
        ? `${firstPart.questionText.substring(0, 100)}...`
        : firstPart.questionText
    }
    return 'Question text not available'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-gray-600">
        {filteredQuestions.length === questions.length ? (
          <p>Showing all {questions.length} questions</p>
        ) : (
          <p>
            Showing {filteredQuestions.length} of {questions.length} questions
          </p>
        )}
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'No questions match your search' : 'No questions available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <Link
              key={question.id}
              href={`/question/${question.id}`}
              className="group block"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group-hover:scale-[1.02]">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {question.id.replace('q', '').replace(/^0+/, '')}
                    </h3>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {question.marks} marks
                    </span>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                </div>

                {/* Question Parts */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <strong>Parts:</strong> {getQuestionSummary(question)}
                  </p>
                </div>

                {/* Question Preview */}
                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {getQuestionPreview(question)}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                  >
                    Analyze →
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 