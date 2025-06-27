"use client"

import { useState } from 'react'
import { Copy, Check, AlertTriangle, BookOpen, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ConceptualUnderstanding } from '@/types'

interface ConceptualTabProps {
  conceptualUnderstanding: ConceptualUnderstanding
  className?: string
}

export function ConceptualTab({ conceptualUnderstanding, className }: ConceptualTabProps) {
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

  const renderMarkdownWithConcepts = (content: string) => {
    // Convert markdown to HTML with concept highlighting
    let processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-700">$1</strong>') // Bold text (misconceptions)
      .replace(/^\s*[-*+]\s+/gm, '<li class="mb-2">') // List items
      .replace(/^#{1,6}\s+(.*)$/gm, (match, text) => {
        const level = match.match(/^#+/)?.[0].length || 1
        const iconClass = level === 2 ? getIconForSection(text) : ''
        return `<h${Math.min(level, 6)} class="font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
          ${iconClass}${text}
        </h${Math.min(level, 6)}>`
      })
      .replace(/>\s*\*\*Key Point\*\*:(.*?)(?=\n|$)/g, 
        '<div class="bg-blue-50 border-l-4 border-blue-400 p-4 my-4"><div class="flex items-center"><svg class="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg><strong class="text-blue-800">Key Point:</strong></div><p class="text-blue-700 mt-2">$1</p></div>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')

    // Wrap in paragraph tags if needed
    if (!processedContent.includes('<h') && !processedContent.includes('<li>') && !processedContent.includes('<div')) {
      processedContent = `<p class="mb-4">${processedContent}</p>`
    }

    return processedContent
  }

  const getIconForSection = (sectionTitle: string) => {
    const title = sectionTitle.toLowerCase()
    if (title.includes('misconception')) {
      return '<svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
    } else if (title.includes('knowledge') || title.includes('gap')) {
      return '<svg class="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    } else if (title.includes('concept') || title.includes('clarification')) {
      return '<svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>'
    }
    return ''
  }

  const extractConceptualItems = (content: string) => {
    const items: Array<{ text: string; type: 'misconception' | 'gap' | 'clarification'; icon: React.ReactNode }> = []
    
    // Extract misconceptions (bold text)
    const misconceptionMatches = content.match(/\*\*(.*?)\*\*/g)
    if (misconceptionMatches) {
      misconceptionMatches.forEach(match => {
        const misconception = match.replace(/\*\*/g, '')
        items.push({ 
          text: misconception, 
          type: 'misconception',
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />
        })
      })
    }

    // Extract bullet points and categorize them
    const bulletMatches = content.match(/^\s*[-*+]\s+(.*)$/gm)
    if (bulletMatches) {
      bulletMatches.forEach(match => {
        const item = match.replace(/^\s*[-*+]\s+/, '').trim()
        let type: 'misconception' | 'gap' | 'clarification' = 'clarification'
        let icon = <Lightbulb className="h-4 w-4 text-green-500" />
        
        if (item.toLowerCase().includes('gap') || item.toLowerCase().includes('review')) {
          type = 'gap'
          icon = <BookOpen className="h-4 w-4 text-orange-500" />
        }
        
        items.push({ text: item, type, icon })
      })
    }

    return items
  }

  const conceptualItems = extractConceptualItems(conceptualUnderstanding.content)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Content */}
      <div className="prose prose-sm max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: renderMarkdownWithConcepts(conceptualUnderstanding.content) 
          }} 
          className="text-gray-700 leading-relaxed"
        />
      </div>

      {/* Conceptual Items Summary */}
      {/* {conceptualItems.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conceptual Overview</h3>
          <div className="grid gap-3">
            {conceptualItems.map((item, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors",
                  {
                    'bg-red-50 border-red-200 hover:bg-red-100': item.type === 'misconception',
                    'bg-orange-50 border-orange-200 hover:bg-orange-100': item.type === 'gap',
                    'bg-green-50 border-green-200 hover:bg-green-100': item.type === 'clarification'
                  }
                )}
              >
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  {item.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.text}
                    </p>
                    <p className={cn(
                      "text-xs capitalize",
                      {
                        'text-red-600': item.type === 'misconception',
                        'text-orange-600': item.type === 'gap',
                        'text-green-600': item.type === 'clarification'
                      }
                    )}>
                      {item.type === 'misconception' ? 'Misconception' : 
                       item.type === 'gap' ? 'Knowledge Gap' : 'Clarification'}
                    </p>
                  </div>
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
      )} */}

      {/* Copy All Button */}
      <div className="border-t pt-6">
        <Button
          variant="outline"
          onClick={() => copyTextToClipboard(conceptualUnderstanding.content, 'full-content')}
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