"use server"

import { db } from '@/db/db'
import { questionsTable, modelAnswerImagesTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { supabase } from '@/lib/api/supabase'
import { analyzeChemistryAnswer, getDefaultModelProvider } from '@/lib/api/llm-analyzer'
import { processUploadedImage, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/utils/image-processing'
import { logError } from '@/lib/utils/error-handling'
import { ActionState, AnalysisResult, ModelAnswerPart, ModelProvider } from '@/types'

/**
 * Server action for analyzing chemistry answers
 * @param formData - FormData containing questionId and image file
 * @param modelProvider - Optional model provider (defaults to environment setting)
 * @returns Promise<ActionState<AnalysisResult>>
 */
export async function analyzeAnswerAction(
  formData: FormData, 
  modelProvider?: ModelProvider
): Promise<ActionState<AnalysisResult>> {
  try {
    // Validate and extract form data
    const questionId = formData.get('questionId') as string
    const imageFile = formData.get('image') as File

    // Validate required fields
    if (!questionId) {
      return {
        isSuccess: false,
        message: 'Question ID is required'
      }
    }

    if (!imageFile || !(imageFile instanceof File)) {
      return {
        isSuccess: false,
        message: 'Image file is required'
      }
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type as any)) {
      return {
        isSuccess: false,
        message: `Invalid file type: ${imageFile.type}. Only JPEG and PNG files are supported.`
      }
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return {
        isSuccess: false,
        message: `File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`
      }
    }

    if (imageFile.size === 0) {
      return {
        isSuccess: false,
        message: 'Uploaded file is empty'
      }
    }

    // Fetch question data using Drizzle ORM
    const question = await db.query.questions.findFirst({
      where: eq(questionsTable.id, questionId)
    })

    if (!question) {
      return {
        isSuccess: false,
        message: 'Question not found'
      }
    }

    // Fetch associated model answer images using Drizzle ORM
    const modelAnswerImages = await db.query.modelAnswerImages.findMany({
      where: eq(modelAnswerImagesTable.questionId, questionId),
      orderBy: modelAnswerImagesTable.position
    })

    // Construct full CDN URLs for reference images
    const referenceImageUrls = modelAnswerImages.map(image => {
      const { data } = supabase.storage
        .from('model-answers')
        .getPublicUrl(image.imgKey)
      
      return data.publicUrl
    })

    // Process the uploaded image (includes EXIF rotation and validation)
    let processedImage
    try {
      processedImage = await processUploadedImage(imageFile)
    } catch (imageError) {
      return {
        isSuccess: false,
        message: imageError instanceof Error ? imageError.message : 'Failed to process image'
      }
    }

    // Call LLM for analysis
    const selectedModelProvider = modelProvider || getDefaultModelProvider()
    let analysisResult: AnalysisResult
    try {
      analysisResult = await analyzeChemistryAnswer({
        studentImageDataUrl: processedImage.dataUrl,
        modelAnswerJson: question.modelAnswerJson as ModelAnswerPart[],
        referenceImageUrls,
        modelProvider: selectedModelProvider
      })
    } catch (analysisError) {
      // Handle specific LLM errors
      if (analysisError instanceof Error) {
        if (analysisError.message === 'UnreadableHandwriting') {
          return {
            isSuccess: false,
            message: 'Unable to read the handwriting in your answer. Please ensure the image is clear and try again.'
          }
        }
        
        if (analysisError.message.includes('timed out')) {
          return {
            isSuccess: false,
            message: 'Analysis took too long to complete. Please try again.'
          }
        }

        // Handle rate limiting errors
        if (analysisError.message.includes('Rate limit exceeded')) {
          return {
            isSuccess: false,
            message: 'Service is currently busy. Please try again in a few minutes.'
          }
        }

        // Handle image size errors
        if (analysisError.message.includes('Image too large')) {
          return {
            isSuccess: false,
            message: 'Image is too large. Please try with a smaller image.'
          }
        }
      }

      logError(analysisError instanceof Error ? analysisError : new Error(String(analysisError)), `LLM Analysis (${selectedModelProvider})`)
      return {
        isSuccess: false,
        message: 'Failed to analyze the answer. Please try again.'
      }
    }

    return {
      isSuccess: true,
      message: 'Analysis completed successfully',
      data: analysisResult
    }

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), 'Server Action analyzeAnswerAction')
    return {
      isSuccess: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
} 