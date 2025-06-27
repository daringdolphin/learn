import { OpenAI } from 'openai'
import { AnalysisResult, AnalysisParams } from '@/types'
import { downloadAndOptimizeImage } from '@/lib/utils/image-processing'
import { OPENAI_CONFIG } from '@/lib/config/openai-config'
import { SYSTEM_PROMPT } from '@/prompts/analysis-prompt'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})



/**
 * Validates if an image URL is accessible to OpenAI
 */
async function validateImageForOpenAI(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FeedbackApp/1.0)',
      }
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
  referenceImageUrls,
  syllabusReference
}: AnalysisParams): Promise<AnalysisResult> {
  const maxRetries = OPENAI_CONFIG.MAX_RETRIES
  let lastError: Error | null = null

  // Strategy 1: Limit the number of reference images to prevent overwhelming OpenAI
  const limitedReferenceUrls = referenceImageUrls.slice(0, OPENAI_CONFIG.MAX_REFERENCE_IMAGES)
  
  if (referenceImageUrls.length > OPENAI_CONFIG.MAX_REFERENCE_IMAGES) {
    console.log(`Limiting reference images from ${referenceImageUrls.length} to ${OPENAI_CONFIG.MAX_REFERENCE_IMAGES} to prevent timeouts`)
  }

  // Strategy 2: Download and optimize reference images to prevent timeouts
  console.log(`Processing ${limitedReferenceUrls.length} reference images...`)
  const referenceDataUrls: string[] = []
  
  for (let i = 0; i < limitedReferenceUrls.length; i++) {
    const url = limitedReferenceUrls[i]
    console.log(`Downloading and optimizing reference image ${i + 1}/${limitedReferenceUrls.length}: ${url}`)
    
    const optimizedDataUrl = await downloadAndOptimizeImage(
      url,
      OPENAI_CONFIG.REFERENCE_IMAGE_MAX_WIDTH,
      OPENAI_CONFIG.REFERENCE_IMAGE_QUALITY
    )
    
    if (optimizedDataUrl) {
      referenceDataUrls.push(optimizedDataUrl)
      console.log(`✓ Successfully optimized reference image ${i + 1}`)
    } else {
      console.warn(`✗ Failed to optimize reference image ${i + 1}: ${url}`)
    }
  }
  
  console.log(`Successfully processed ${referenceDataUrls.length}/${limitedReferenceUrls.length} reference images`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Strategy 3: Progressive degradation - try with fewer images if timeout occurs
      if (attempt === 1) {
        // First attempt: try with all converted reference images
        return await performAnalysis({
          studentImageDataUrl,
          modelAnswerJson,
          referenceImageUrls: referenceDataUrls,
          syllabusReference
        })
      } else if (attempt === 2) {
        // Second attempt: try with half the reference images
        const halfImages = referenceDataUrls.slice(0, Math.ceil(referenceDataUrls.length / 2))
        console.log(`Retry attempt ${attempt}: using ${halfImages.length} reference images`)
        return await performAnalysis({
          studentImageDataUrl,
          modelAnswerJson,
          referenceImageUrls: halfImages,
          syllabusReference
        })
      } else {
        // Final attempt: try without any reference images
        console.log(`Final attempt ${attempt}: analyzing without reference images`)
        return await performAnalysis({
          studentImageDataUrl,
          modelAnswerJson,
          referenceImageUrls: [],
          syllabusReference
        })
      }
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
        const delay = Math.min(
          Math.pow(2, attempt) * OPENAI_CONFIG.INITIAL_RETRY_DELAY,
          OPENAI_CONFIG.MAX_RETRY_DELAY
        )
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Analysis failed after all retry attempts')
}

async function performAnalysis({
  studentImageDataUrl,
  modelAnswerJson,
  referenceImageUrls,
  syllabusReference
}: AnalysisParams): Promise<AnalysisResult> {
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

  // Add reference images with low detail (using data URLs to prevent download timeouts)
  if (referenceImageUrls.length > 0) {
    console.log(`Adding ${referenceImageUrls.length} reference images to analysis`)
    for (let i = 0; i < referenceImageUrls.length; i++) {
      const referenceUrl = referenceImageUrls[i]
      messageContent.push({
        type: "image_url",
        image_url: {
          url: referenceUrl,
          detail: "low" // Low detail for reference images to save tokens
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

  // Add syllabus reference information
  messageContent.push({
    type: "text",
    text: `Syllabus Reference:\n${JSON.stringify(syllabusReference, null, 2)}`
  })

  // Create the completion with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_CONFIG.ANALYSIS_TIMEOUT)

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE,
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
      throw new Error(`Analysis timed out after ${OPENAI_CONFIG.ANALYSIS_TIMEOUT / 1000} seconds`)
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