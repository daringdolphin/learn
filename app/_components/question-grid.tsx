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
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200 group-hover:scale-[1.02]">
                {/* Question Header */}
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {question.id.replace('q', '').replace(/^0+/, '')}
                  </h3>
                </div>

                {/* Question Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {question.marks} marks
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 