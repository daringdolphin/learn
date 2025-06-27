import { AnalysisResult, AnalysisParams, ModelProvider } from '@/types'
import { analyzeChemistryAnswer as analyzeWithOpenAI } from './openai'
import { analyzeChemistryAnswerClaude as analyzeWithClaude } from './anthropic'

/**
 * Unified function to analyze chemistry answers using different LLM providers
 * @param params - Analysis parameters including model provider
 * @returns Promise resolving to analysis result
 */
export async function analyzeChemistryAnswer(params: Required<AnalysisParams>): Promise<AnalysisResult> {
  const { modelProvider, ...analysisParams } = params

  switch (modelProvider) {
    case 'openai':
      return await analyzeWithOpenAI(analysisParams)
    
    case 'anthropic':
      return await analyzeWithClaude(analysisParams)
    
    default:
      throw new Error(`Unsupported model provider: ${modelProvider}`)
  }
}

/**
 * Helper function to get default model provider from environment or fallback
 */
export function getDefaultModelProvider(): ModelProvider {
  const envProvider = process.env.DEFAULT_MODEL_PROVIDER as ModelProvider
  
  // Validate environment variable
  if (envProvider && (envProvider === 'openai' || envProvider === 'anthropic')) {
    return envProvider
  }
  
  // Fallback to OpenAI if no valid provider is set
  return 'openai'
} 