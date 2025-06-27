import Anthropic from '@anthropic-ai/sdk'
import { AnalysisResult, AnalysisParams } from '@/types'
import { downloadAndOptimizeImage } from '@/lib/utils/image-processing'
import { ANTHROPIC_CONFIG } from '@/lib/config/anthropic-config'
import { SYSTEM_PROMPT } from '@/prompts/analysis-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Analyzes a chemistry answer using Claude Vision
 * @param params - Contains student image, model answer JSON, and reference images
 * @returns Promise resolving to analysis result with dual-track feedback
 */
export async function analyzeChemistryAnswerClaude({
  studentImageDataUrl,
  modelAnswerJson,
  referenceImageUrls,
  syllabusReference
}: AnalysisParams): Promise<AnalysisResult> {
  const maxRetries = ANTHROPIC_CONFIG.MAX_RETRIES
  let lastError: Error | null = null

  // Strategy 1: Limit the number of reference images to prevent overwhelming Claude
  const limitedReferenceUrls = referenceImageUrls.slice(0, ANTHROPIC_CONFIG.MAX_REFERENCE_IMAGES)
  
  if (referenceImageUrls.length > ANTHROPIC_CONFIG.MAX_REFERENCE_IMAGES) {
    console.log(`Limiting reference images from ${referenceImageUrls.length} to ${ANTHROPIC_CONFIG.MAX_REFERENCE_IMAGES} to prevent timeouts`)
  }

  // Strategy 2: Download and optimize reference images to prevent timeouts
  console.log(`Processing ${limitedReferenceUrls.length} reference images...`)
  const referenceDataUrls: string[] = []
  
  for (let i = 0; i < limitedReferenceUrls.length; i++) {
    const url = limitedReferenceUrls[i]
    console.log(`Downloading and optimizing reference image ${i + 1}/${limitedReferenceUrls.length}: ${url}`)
    
    const optimizedDataUrl = await downloadAndOptimizeImage(
      url,
      ANTHROPIC_CONFIG.REFERENCE_IMAGE_MAX_WIDTH,
      ANTHROPIC_CONFIG.REFERENCE_IMAGE_QUALITY
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
        return await performClaudeAnalysis({
          studentImageDataUrl,
          modelAnswerJson,
          referenceImageUrls: referenceDataUrls,
          syllabusReference
        })
      } else if (attempt === 2) {
        // Second attempt: try with half the reference images
        const halfImages = referenceDataUrls.slice(0, Math.ceil(referenceDataUrls.length / 2))
        console.log(`Retry attempt ${attempt}: using ${halfImages.length} reference images`)
        return await performClaudeAnalysis({
          studentImageDataUrl,
          modelAnswerJson,
          referenceImageUrls: halfImages,
          syllabusReference
        })
      } else {
        // Final attempt: try without any reference images
        console.log(`Final attempt ${attempt}: analyzing without reference images`)
        return await performClaudeAnalysis({
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
      if (error instanceof Anthropic.APIError) {
        if (error.status === 400 || error.status === 401) {
          throw error // Authentication or bad request - don't retry
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(
          Math.pow(2, attempt) * ANTHROPIC_CONFIG.INITIAL_RETRY_DELAY,
          ANTHROPIC_CONFIG.MAX_RETRY_DELAY
        )
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Analysis failed after all retry attempts')
}

async function performClaudeAnalysis({
  studentImageDataUrl,
  modelAnswerJson,
  referenceImageUrls,
  syllabusReference
}: AnalysisParams): Promise<AnalysisResult> {
  // Build the message content array
  const messageContent: Anthropic.MessageParam['content'] = [
    {
      type: "text",
      text: "Analyze this chemistry answer against the model answer provided. Return your response in the required JSON format with examSkills and conceptualUnderstanding sections."
    },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: getMediaTypeFromDataUrl(studentImageDataUrl),
        data: getBase64FromDataUrl(studentImageDataUrl)
      }
    }
  ]

  // Add reference images
  if (referenceImageUrls.length > 0) {
    console.log(`Adding ${referenceImageUrls.length} reference images to analysis`)
    for (let i = 0; i < referenceImageUrls.length; i++) {
      const referenceUrl = referenceImageUrls[i]
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: getMediaTypeFromDataUrl(referenceUrl),
          data: getBase64FromDataUrl(referenceUrl)
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
  const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_CONFIG.ANALYSIS_TIMEOUT)

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_CONFIG.MODEL,
      max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
      temperature: ANTHROPIC_CONFIG.TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: messageContent
        },
        {
          role: "assistant",
          content: "{\n  \"examSkills\": {\n    \"content\": \""
        }
      ]
    }, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Extract the text content from Claude's response
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    // Combine the prefill with Claude's response to get the complete JSON
    const prefill = '{\n  "examSkills": {\n    "content": "'
    const responseText = prefill + textContent.text

    // Parse the JSON response
    let analysisResult: AnalysisResult
    
    try {
      // Extract and clean the JSON from Claude's response
      const cleanedJson = extractAndCleanJson(responseText)
      console.log('Cleaned JSON for parsing:', cleanedJson.substring(0, 200) + '...')
      analysisResult = JSON.parse(cleanedJson)
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText)
      console.error('Parse error:', parseError)
      
      // Final fallback - try to extract JSON manually and parse again
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const manuallyFixed = jsonMatch[0]
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
          analysisResult = JSON.parse(manuallyFixed)
        } else {
          throw new Error('No JSON object found in response')
        }
      } catch (fallbackError) {
        console.error('All JSON parsing attempts failed:', fallbackError)
        throw new Error('Invalid JSON response from Claude')
      }
    }

    // Validate the response structure
    if (!validateAnalysisResult(analysisResult)) {
      console.error('Invalid analysis result structure:', analysisResult)
      throw new Error('Invalid analysis result structure from Claude')
    }

    return analysisResult

  } catch (error) {
    clearTimeout(timeoutId)
    
    // Handle specific Claude errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.status === 413) {
        throw new Error('Image too large. Please try with a smaller image.')
      }
    }

    // Handle abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again.')
    }

    throw error
  }
}

/**
 * Helper function to fix common JSON control character issues
 */
function fixJsonControlCharacters(jsonString: string): string {
  // First, try to extract just the JSON object if it's embedded in other text
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : jsonString;
  
  // Fix common control character issues in JSON strings
  // We need to be more careful about which quotes we're replacing within
  let result = cleanJson;
  
  // Split the string into segments: outside quotes, inside quotes
  const segments: string[] = [];
  let currentSegment = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    
    if (escapeNext) {
      currentSegment += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      currentSegment += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      if (inString) {
        // End of string - add the quote and push the segment
        currentSegment += char;
        segments.push(currentSegment);
        currentSegment = '';
        inString = false;
      } else {
        // Start of string - push any existing segment and start new one
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = char;
        inString = true;
      }
      continue;
    }
    
    if (inString) {
      // Inside a string - escape control characters
      switch (char) {
        case '\n':
          currentSegment += '\\n';
          break;
        case '\r':
          currentSegment += '\\r';
          break;
        case '\t':
          currentSegment += '\\t';
          break;
        case '\b':
          currentSegment += '\\b';
          break;
        case '\f':
          currentSegment += '\\f';
          break;
        default:
          currentSegment += char;
      }
    } else {
      // Outside a string - keep as is
      currentSegment += char;
    }
  }
  
  // Push the final segment
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments.join('');
}

/**
 * Helper function to extract and clean JSON from Claude's response
 */
function extractAndCleanJson(responseText: string): string {
  // Remove markdown code blocks if present
  let cleaned = responseText.trim();
  
  // Check if the response is wrapped in markdown code blocks
  if (cleaned.startsWith('```json') && cleaned.endsWith('```')) {
    cleaned = cleaned.slice(7, -3).trim();
  } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.slice(3, -3).trim();
  }
  
  // Try to find the JSON object within the text
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  // Apply control character fixes
  return fixJsonControlCharacters(cleaned);
}

/**
 * Helper function to extract media type from data URL
 */
function getMediaTypeFromDataUrl(dataUrl: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (dataUrl.startsWith('data:image/png')) return 'image/png'
  if (dataUrl.startsWith('data:image/gif')) return 'image/gif'
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp'
  return 'image/jpeg' // default
}

/**
 * Helper function to extract base64 data from data URL
 */
function getBase64FromDataUrl(dataUrl: string): string {
  const base64Index = dataUrl.indexOf(',')
  if (base64Index === -1) {
    throw new Error('Invalid data URL format')
  }
  return dataUrl.substring(base64Index + 1)
}

/**
 * Validates the structure of the analysis result
 */
function validateAnalysisResult(result: any): result is AnalysisResult {
  return (
    result &&
    typeof result === 'object' &&
    result.examSkills &&
    typeof result.examSkills === 'object' &&
    typeof result.examSkills.content === 'string' &&
    result.conceptualUnderstanding &&
    typeof result.conceptualUnderstanding === 'object' &&
    typeof result.conceptualUnderstanding.content === 'string'
  )
} 