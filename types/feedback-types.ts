export interface AnalysisResult {
  examSkills: ExamSkills
  conceptualUnderstanding: ConceptualUnderstanding
}

export interface ExamSkills {
  missingKeywords: string[]
  phrasingImprovements: string[]
  markRecoveryActions: string[]
}

export interface ConceptualUnderstanding {
  misconceptions: string[]
  knowledgeGaps: string[]
  conceptClarifications: string[]
} 