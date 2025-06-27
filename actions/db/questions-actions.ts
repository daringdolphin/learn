"use server"

import { db } from "@/db/db"
import { questionsTable, modelAnswerImagesTable } from "@/db/schema"
import { supabase } from "@/lib/api/supabase"
import { ActionState } from "@/types"
import type { SelectQuestion, SelectModelAnswerImage } from "@/db/schema"
import type { ModelAnswerResponse, Question } from "@/types"
import { eq } from "drizzle-orm"

export async function getAllQuestionsAction(): Promise<ActionState<Question[]>> {
  try {
    const questions = await db.query.questions.findMany({
      orderBy: (questions, { asc }) => [asc(questions.id)]
    })

    const mappedQuestions: Question[] = questions.map(q => ({
      id: q.id,
      promptImg: q.promptImg,
      modelAnswerJson: q.modelAnswerJson as any,
      marks: q.marks,
      createdAt: q.createdAt.toISOString()
    }))

    return {
      isSuccess: true,
      message: "Questions retrieved successfully",
      data: mappedQuestions
    }
  } catch (error) {
    console.error("Error fetching questions:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch questions"
    }
  }
}

export async function getQuestionByIdAction(questionId: string): Promise<ActionState<Question>> {
  try {
    const question = await db.query.questions.findFirst({
      where: eq(questionsTable.id, questionId)
    })

    if (!question) {
      return {
        isSuccess: false,
        message: "Question not found"
      }
    }

    const mappedQuestion: Question = {
      id: question.id,
      promptImg: question.promptImg,
      modelAnswerJson: question.modelAnswerJson as any,
      marks: question.marks,
      createdAt: question.createdAt.toISOString()
    }

    return {
      isSuccess: true,
      message: "Question retrieved successfully",
      data: mappedQuestion
    }
  } catch (error) {
    console.error("Error fetching question:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch question"
    }
  }
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn(`Failed to validate image URL ${url}:`, error)
    return false
  }
}

export async function getModelAnswerByQuestionIdAction(questionId: string): Promise<ActionState<ModelAnswerResponse>> {
  try {
    // Fetch question data
    const question = await db.query.questions.findFirst({
      where: eq(questionsTable.id, questionId)
    })

    if (!question) {
      return {
        isSuccess: false,
        message: "Question not found"
      }
    }

    // Fetch associated images
    const images = await db.query.modelAnswerImages.findMany({
      where: eq(modelAnswerImagesTable.questionId, questionId),
      orderBy: (images, { asc }) => [asc(images.position)]
    })

    console.log(`Found ${images.length} images for question ${questionId}`)

    // Construct and validate full CDN URLs for images using Supabase Storage
    const modelAnswerImgUrls: string[] = []
    
    for (const img of images) {
      const { data } = supabase.storage
        .from('model-answers')
        .getPublicUrl(img.imgKey)

      const publicUrl = data.publicUrl
      console.log(`Generated URL for ${img.imgKey}: ${publicUrl}`)
      
      // Validate the URL is accessible
      const isValid = await validateImageUrl(publicUrl)
      if (isValid) {
        modelAnswerImgUrls.push(publicUrl)
        console.log(`✓ URL validated: ${publicUrl}`)
      } else {
        console.warn(`✗ URL validation failed: ${publicUrl}`)
        
        // Try alternative URL format if the default fails
        const alternativeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-answers/${img.imgKey}`
        console.log(`Trying alternative URL: ${alternativeUrl}`)
        
        const isAlternativeValid = await validateImageUrl(alternativeUrl)
        if (isAlternativeValid) {
          modelAnswerImgUrls.push(alternativeUrl)
          console.log(`✓ Alternative URL validated: ${alternativeUrl}`)
        } else {
          console.error(`Both URLs failed for image: ${img.imgKey}`)
        }
      }
    }

    console.log(`Final validated URLs: ${modelAnswerImgUrls.length}/${images.length}`)

    const response: ModelAnswerResponse = {
      modelAnswerImgUrls,
      modelAnswerJson: question.modelAnswerJson as any
    }

    return {
      isSuccess: true,
      message: "Model answer retrieved successfully",
      data: response
    }
  } catch (error) {
    console.error("Error fetching model answer:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch model answer"
    }
  }
} 