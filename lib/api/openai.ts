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
 * Validates if an image URL is accessible to OpenAI
 */
async function validateImageForOpenAI(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Check if it's a valid image and accessible
    const contentType = response.headers.get('content-type')
    return response.ok && contentType !== null && contentType.startsWith('image/')
  } catch (error) {
    console.warn(`Image validation failed for ${url}:`, error)
    return false
  }
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

  // Pre-validate reference image URLs
  console.log(`Validating ${referenceImageUrls.length} reference image URLs...`)
  const validatedReferenceUrls: string[] = []
  
  for (const url of referenceImageUrls) {
    const isValid = await validateImageForOpenAI(url)
    if (isValid) {
      validatedReferenceUrls.push(url)
      console.log(`✓ Reference image validated: ${url}`)
    } else {
      console.warn(`✗ Reference image failed validation: ${url}`)
    }
  }
  
  console.log(`Using ${validatedReferenceUrls.length}/${referenceImageUrls.length} validated reference images`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await performAnalysis({
        studentImageDataUrl,
        modelAnswerJson,
        referenceImageUrls: validatedReferenceUrls
      })
    } catch (error) {
      lastError = error as Error
      console.warn(`Analysis attempt ${attempt} failed:`, error)
      
      // Don't retry on certain error types
      if (error instanceof OpenAI.APIError) {
        if (error.status === 400 || error.status === 401) {
          throw error // Authentication or bad request - don't retry
        }
        
        // If it's an image URL error, try without reference images
        if (error.code === 'invalid_image_url' && validatedReferenceUrls.length > 0 && attempt === 1) {
          console.log('Retrying without reference images due to image URL error...')
          try {
            return await performAnalysis({
              studentImageDataUrl,
              modelAnswerJson,
              referenceImageUrls: []
            })
          } catch (retryError) {
            console.warn('Retry without reference images also failed:', retryError)
          }
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
  const systemPrompt = `
  You are an expert academic tutor specializing in providing constructive, targeted feedback on student exam papers. Your role is to help students understand their mistakes, learn from them, and improve their performance on future assessments.

You will receive:
1. an image of a student's handwritten exam paper that is graded with annotations by person who is marking in red.
2. a JSON object containing the model answer for the question.
${referenceImageUrls.length > 0 ? '3. reference images for the question showing the model answer.' : '3. No reference images are available for this question.'}

## Core Problem
Students often understand chemistry concepts but lose marks because they don't use the specific keywords and phrasing that markers expect. Others have conceptual gaps that need addressing.

## Your Task
Analyze the student's work and provide concise, actionable feedback in TWO areas:

### Exam Skills Focus
Help them "play the exam game" better - how to phrase answers to hit marking criteria

### Conceptual Understanding Focus  
Address any fundamental chemistry misconceptions or knowledge gaps

## Communication Style
- Direct and concise - get to the point quickly
- Specific examples - show exactly what to change
- Encouraging tone - focus on improvement, not criticism
- Student-focused - address them as "you"

## Required JSON Output Format

{
  "examSkills": {
    "content": "markdown formatted feedback here"
  },
  "conceptualUnderstanding": {
    "content": "markdown formatted feedback here"
  }
}
## Content Structure
For examSkills section:
## What You Wrote

Quote/summarize their key points

## What Markers Want

Specific keywords/phrases from marking scheme

## How to Rephrase

Direct examples of better wording
Show mark allocation per point

For conceptualUnderstanding section:
## Concept Check

Any misconceptions identified
Missing foundational knowledge

## Key Chemistry Principles

Core concepts they need to understand
How concepts connect to the question

## Study Focus

Specific topics to review
Practice question types

Formatting Guidelines

Use bold for key terms and keywords
Use backticks for chemical formulas
Use bullet points for lists
Keep explanations under 3 sentences each
Focus on the 2-3 most important improvements

Be laser-focused on what will immediately improve their next attempt at similar questions.
`
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

  // Add reference images with low detail (only if validated)
  if (referenceImageUrls.length > 0) {
    console.log(`Adding ${referenceImageUrls.length} reference images to analysis`)
    for (const referenceUrl of referenceImageUrls) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: referenceUrl,
          detail: "low" // Low detail for reference images
        }
      })
    }
  } else {
    console.log('No reference images available for analysis')
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

function validateAnalysisResult(result: any): result is AnalysisResult {
  return (
    result &&
    typeof result === 'object' &&
    result.examSkills &&
    typeof result.examSkills.content === 'string' &&
    result.conceptualUnderstanding &&
    typeof result.conceptualUnderstanding.content === 'string'
  )
} 