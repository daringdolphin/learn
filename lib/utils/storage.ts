import type { AnalysisResult } from '@/types'

export const STORAGE_KEY_PREFIX = 'chem_analysis_'
export const STORAGE_VERSION = '1.0'
export const MAX_STORAGE_AGE_DAYS = 30
export const MAX_STORAGE_QUOTA = 5 * 1024 * 1024 // 5MB

interface StoredAnalysis {
  version: string
  questionId: string
  result: AnalysisResult
  timestamp: number
}

export function saveAnalysisResult(questionId: string, result: AnalysisResult): boolean {
  try {
    // Check storage quota before saving
    if (!checkStorageQuota()) {
      clearOldResults()
      if (!checkStorageQuota()) {
        console.warn('Storage quota exceeded')
        return false
      }
    }

    const analysis: StoredAnalysis = {
      version: STORAGE_VERSION,
      questionId,
      result,
      timestamp: Date.now()
    }

    const key = `${STORAGE_KEY_PREFIX}${questionId}`
    localStorage.setItem(key, JSON.stringify(analysis))
    return true
  } catch (error) {
    console.error('Error saving analysis result:', error)
    return false
  }
}

export function getAnalysisResult(questionId: string): AnalysisResult | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${questionId}`
    const stored = localStorage.getItem(key)
    
    if (!stored) return null

    const analysis: StoredAnalysis = JSON.parse(stored)
    
    // Check version compatibility
    if (analysis.version !== STORAGE_VERSION) {
      // Remove incompatible version
      localStorage.removeItem(key)
      return null
    }

    // Check if result is too old
    const ageInDays = (Date.now() - analysis.timestamp) / (1000 * 60 * 60 * 24)
    if (ageInDays > MAX_STORAGE_AGE_DAYS) {
      localStorage.removeItem(key)
      return null
    }

    return analysis.result
  } catch (error) {
    console.error('Error retrieving analysis result:', error)
    return null
  }
}

export function getAllAnalysisResults(): Array<{ questionId: string; result: AnalysisResult; timestamp: number }> {
  try {
    const results: Array<{ questionId: string; result: AnalysisResult; timestamp: number }> = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const analysis: StoredAnalysis = JSON.parse(stored)
            if (analysis.version === STORAGE_VERSION) {
              results.push({
                questionId: analysis.questionId,
                result: analysis.result,
                timestamp: analysis.timestamp
              })
            }
          } catch {
            // Skip invalid entries
            continue
          }
        }
      }
    }
    
    return results.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error getting all analysis results:', error)
    return []
  }
}

export function clearOldResults(): number {
  try {
    let removedCount = 0
    const cutoffTime = Date.now() - (MAX_STORAGE_AGE_DAYS * 24 * 60 * 60 * 1000)
    
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const analysis: StoredAnalysis = JSON.parse(stored)
            if (analysis.timestamp < cutoffTime || analysis.version !== STORAGE_VERSION) {
              keysToRemove.push(key)
            }
          } catch {
            // Remove invalid entries
            keysToRemove.push(key)
          }
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      removedCount++
    })
    
    return removedCount
  } catch (error) {
    console.error('Error clearing old results:', error)
    return 0
  }
}

export function checkStorageQuota(): boolean {
  try {
    // Estimate storage usage
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
        }
      }
    }
    
    return totalSize < MAX_STORAGE_QUOTA
  } catch (error) {
    console.error('Error checking storage quota:', error)
    return false
  }
}

export function removeAnalysisResult(questionId: string): boolean {
  try {
    const key = `${STORAGE_KEY_PREFIX}${questionId}`
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing analysis result:', error)
    return false
  }
} 