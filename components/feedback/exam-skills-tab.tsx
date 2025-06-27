"use client"

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExamSkills } from '@/types'

interface ExamSkillsTabProps {
  examSkills: ExamSkills
  className?: string
}

export function ExamSkillsTab({ examSkills, className }: ExamSkillsTabProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyTextToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const renderMarkdownWithKeywords = (content: string) => {
    // Convert markdown to HTML with keyword highlighting
    let processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/^\s*[-*+]\s+/gm, '<li>') // List items
      .replace(/^#{1,6}\s+(.*)$/gm, (match, text, offset) => {
        const level = match.match(/^#+/)?.[0].length || 1
        return `<h${Math.min(level, 6)} class="font-semibold text-gray-900 mb-2 mt-4">${text}</h${Math.min(level, 6)}>`
      })
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')

    // Wrap in paragraph tags
    if (!processedContent.includes('<h') && !processedContent.includes('<li>')) {
      processedContent = `<p class="mb-4">${processedContent}</p>`
    }

    return processedContent
  }

  const extractActionableItems = (content: string) => {
    const items: Array<{ text: string; type: string }> = []
    
    // Extract missing keywords
    const keywordMatches = content.match(/\*\*(.*?)\*\*/g)
    if (keywordMatches) {
      keywordMatches.forEach(match => {
        const keyword = match.replace(/\*\*/g, '')
        items.push({ text: keyword, type: 'keyword' })
      })
    }

    // Extract bullet points as actionable items
    const bulletMatches = content.match(/^\s*[-*+]\s+(.*)$/gm)
    if (bulletMatches) {
      bulletMatches.forEach(match => {
        const item = match.replace(/^\s*[-*+]\s+/, '').trim()
        items.push({ text: item, type: 'action' })
      })
    }

    return items
  }

  const actionableItems = extractActionableItems(examSkills.content)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Content */}
      <div className="prose prose-sm max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: renderMarkdownWithKeywords(examSkills.content) 
          }} 
          className="text-gray-700 leading-relaxed"
        />
      </div>

      {/* Quick Actions */}
      {actionableItems.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-3">
            {actionableItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.text}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {item.type === 'keyword' ? 'Missing Keyword' : 'Action Item'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyTextToClipboard(item.text, `${item.type}-${index}`)}
                  className="ml-2 h-8 w-8 p-0"
                >
                  {copiedItem === `${item.type}-${index}` ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy All Button */}
      <div className="border-t pt-6">
        <Button
          variant="outline"
          onClick={() => copyTextToClipboard(examSkills.content, 'full-content')}
          className="w-full sm:w-auto"
        >
          {copiedItem === 'full-content' ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy All Feedback
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 