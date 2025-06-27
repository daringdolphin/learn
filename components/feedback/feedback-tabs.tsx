"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ExamSkillsTab } from '@/components/feedback/exam-skills-tab'
import { ConceptualTab } from '@/components/feedback/conceptual-tab'
import type { AnalysisResult } from '@/types'

interface FeedbackTabsProps {
  analysisResult: AnalysisResult
  className?: string
}

type TabType = 'exam-skills' | 'conceptual'

export function FeedbackTabs({ analysisResult, className }: FeedbackTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('conceptual')

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
            onClick={() => setActiveTab('conceptual')}
            className={cn(
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'conceptual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-selected={activeTab === 'conceptual'}
          >
            Knowledge Gaps
          </button>
          <button
            onClick={() => setActiveTab('exam-skills')}
            className={cn(
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'exam-skills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-selected={activeTab === 'exam-skills'}
          >
            Exam Skills
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'conceptual' && (
        <ConceptualTab conceptualUnderstanding={analysisResult.conceptualUnderstanding} />
        )}
        {activeTab === 'exam-skills' && (
          <ExamSkillsTab examSkills={analysisResult.examSkills} />
        )}
      </div>
    </div>
  )
} 