import { OpenAI } from 'openai'
import { AnalysisResult, ModelAnswerPart } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface AnalyzeChemistryAnswerParams {
  studentImageDataUrl: string
  modelAnswerJson: ModelAnswerPart[]
  referenceImageUrls: string[]
}

/**
 * Analyzes a chemistry answer using GPT-4o Vision
 * @param params - Contains student image, model answer JSON, and reference images
 * @returns Promise resolving to analysis result with dual-track feedback
 */
export async function analyzeChemistryAnswer({
  studentImageDataUrl,
  modelAnswerJson,
  referenceImageUrls
}: AnalyzeChemistryAnswerParams): Promise<AnalysisResult> {
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await performAnalysis({
        studentImageDataUrl,
        modelAnswerJson,
        referenceImageUrls
      })
    } catch (error) {
      lastError = error as Error
      console.warn(`Analysis attempt ${attempt} failed:`, error)
      
      // Don't retry on certain error types
      if (error instanceof OpenAI.APIError) {
        if (error.status === 400 || error.status === 401) {
          throw error // Authentication or bad request - don't retry
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  throw lastError || new Error('Analysis failed after all retry attempts')
}

async function performAnalysis({
  studentImageDataUrl,
  modelAnswerJson,
  referenceImageUrls
}: AnalyzeChemistryAnswerParams): Promise<AnalysisResult> {
  // Construct the system prompt
  const systemPrompt = `You are analyzing a Secondary-4 chemistry exam answer. Your task is to provide dual-track feedback:

1. EXAM SKILLS: Focus on missing keywords, phrasing improvements, and mark recovery strategies
2. CONCEPTUAL UNDERSTANDING: Identify misconceptions, knowledge gaps, and provide clarifications

Return your analysis as JSON with this exact structure:
{
  "examSkills": {
    "content": "markdown formatted feedback here"
  },
  "conceptualUnderstanding": {
    "content": "markdown formatted feedback here"
  }
}

For the content fields, use markdown formatting to structure your feedback:
- Use **bold** for emphasis on key terms
- Use bullet points (-) for lists
- Use headers (##, ###) to organize sections
- Use backticks for chemical formulas and equations
- Use > for important notes or warnings

Be concise, specific, and actionable in your feedback. Structure each content section with clear subsections for better readability.`

  // Build the message content array
  const messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: "Analyze this chemistry answer against the model answer provided."
    },
    {
      type: "image_url",
      image_url: {
        url: studentImageDataUrl,
        detail: "high" // High detail for student's answer
      }
    }
  ]

  // Add reference images with low detail
  for (const referenceUrl of referenceImageUrls) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: referenceUrl,
        detail: "low" // Low detail for reference images
      }
    })
  }

  // Add model answer JSON as text
  messageContent.push({
    type: "text",
    text: `Model Answer JSON:\n${JSON.stringify(modelAnswerJson, null, 2)}`
  })

  // Create the completion with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 second timeout

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 1500,
      temperature: 0.1, // Low temperature for consistent, focused responses
      response_format: { type: "json_object" }
    }, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response content received from OpenAI')
    }

    // Parse and validate the JSON response
    let analysisResult: AnalysisResult
    try {
      analysisResult = JSON.parse(responseContent) as AnalysisResult
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`)
    }

    // Validate the structure
    if (!validateAnalysisResult(analysisResult)) {
      throw new Error('Invalid analysis result structure received from OpenAI')
    }

    return analysisResult

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Analysis timed out after 120 seconds')
    }
    
    if (error instanceof OpenAI.APIError) {
      if (error.status === 422) {
        throw new Error('UnreadableHandwriting')
      }
    }
    
    throw error
  }
}

/**
 * Validates that the analysis result has the expected structure
 */
function validateAnalysisResult(result: any): result is AnalysisResult {
  if (!result || typeof result !== 'object') return false
  
  const { examSkills, conceptualUnderstanding } = result
  
  // Validate examSkills structure
  if (!examSkills || typeof examSkills !== 'object') return false
  if (typeof examSkills.content !== 'string') return false
  
  // Validate conceptualUnderstanding structure
  if (!conceptualUnderstanding || typeof conceptualUnderstanding !== 'object') return false
  if (typeof conceptualUnderstanding.content !== 'string') return false
  
  return true
} 