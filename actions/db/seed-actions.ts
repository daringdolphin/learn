"use server"

import { db } from "@/db/db"
import { questionsTable, modelAnswerImagesTable } from "@/db/schema"
import { supabaseService } from "@/lib/api/supabase"
import { ActionState } from "@/types"
import { readFile } from "fs/promises"
import { join } from "path"

interface SeedQuestion {
  question_number: string
  part: string
  subpart?: string
  question_text: string
  marks: string
  answers_for_each_mark: {
    text: string
    keywords: string
    notes: string
  }[]
}

export async function seedDatabaseAction(): Promise<ActionState<{ questionsSeeded: number; imagesUploaded: number }>> {
  try {
    // Read the model answers JSON file
    const modelAnswersPath = join(process.cwd(), 'db/seed/model-answers.json')
    const modelAnswersData = await readFile(modelAnswersPath, 'utf-8')
    const seedQuestions: SeedQuestion[] = JSON.parse(modelAnswersData)

    // Group questions by question number
    const questionGroups = seedQuestions.reduce((acc, item) => {
      if (!acc[item.question_number]) {
        acc[item.question_number] = []
      }
      acc[item.question_number].push(item)
      return acc
    }, {} as Record<string, SeedQuestion[]>)

    let questionsSeeded = 0
    let imagesUploaded = 0

    // Process each question group
    for (const [questionNumber, parts] of Object.entries(questionGroups)) {
      // Convert seed format to our model answer format
      const modelAnswerJson = parts.map(part => ({
        part: part.part,
        subpart: part.subpart || undefined,
        questionText: part.question_text,
        marks: parseInt(part.marks),
        answers: part.answers_for_each_mark.map(answer => ({
          text: answer.text,
          keywords: answer.keywords ? answer.keywords.split(',').map(k => k.trim()) : [],
          notes: answer.notes,
          marks: 1 // Default to 1 mark per answer point
        }))
      }))

      // Calculate total marks for the question
      const totalMarks = parts.reduce((sum, part) => sum + parseInt(part.marks), 0)

      // Insert question into database
      const questionId = `q${questionNumber.padStart(4, '0')}`
      await db.insert(questionsTable).values({
        id: questionId,
        promptImg: `question-${questionNumber}.jpg`, // Default prompt image name
        modelAnswerJson: modelAnswerJson as any,
        marks: totalMarks
      }).onConflictDoNothing()

      questionsSeeded++

      // Handle image uploads for this question
      const imageFilesPath = join(process.cwd(), 'db/seed/question-images')
      
      try {
        // Look for images that match this question number
        const { readdir } = await import('fs/promises')
        const allFiles = await readdir(imageFilesPath)
        
        // Find images that match the question number with special handling for variants
        let questionImages: string[] = []
        
        if (questionNumber === '9either') {
          // Look for files like "9-either.1.jpg", "9-either.2.jpg"
          questionImages = allFiles.filter(file => 
            file.startsWith('9-either.')
          ).sort()
        } else if (questionNumber === '9or') {
          // Look for files like "9-or.1.jpg", "9-or.2.jpg"
          questionImages = allFiles.filter(file => 
            file.startsWith('9-or.')
          ).sort()
        } else {
          // Standard pattern: look for files like "1.jpg", "2.1.jpg", "2.2.jpg"
          questionImages = allFiles.filter(file => 
            file.startsWith(`${questionNumber}.`)
          ).sort()
        }

        // Upload each image to Supabase storage
        for (let i = 0; i < questionImages.length; i++) {
          const imagePath = join(imageFilesPath, questionImages[i])
          const imageBuffer = await readFile(imagePath)
          
          // Upload to Supabase storage
          const storageKey = `model-answers/${questionId}/${questionImages[i]}`
          const { error: uploadError } = await supabaseService.storage
            .from('model-answers')
            .upload(storageKey, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            })

          if (uploadError) {
            console.warn(`Failed to upload image ${questionImages[i]}:`, uploadError)
            continue
          }

          // Insert image record into database
          await db.insert(modelAnswerImagesTable).values({
            questionId,
            imgKey: storageKey,
            position: i
          }).onConflictDoNothing()

          imagesUploaded++
        }
      } catch (imageError) {
        console.warn(`Failed to process images for question ${questionNumber}:`, imageError)
      }
    }

    return {
      isSuccess: true,
      message: `Successfully seeded ${questionsSeeded} questions and uploaded ${imagesUploaded} images`,
      data: { questionsSeeded, imagesUploaded }
    }

  } catch (error) {
    console.error("Error seeding database:", error)
    return { 
      isSuccess: false, 
      message: "Failed to seed database" 
    }
  }
}

export async function clearDatabaseAction(): Promise<ActionState<void>> {
  try {
    // Clear model answer images first (due to foreign key constraint)
    await db.delete(modelAnswerImagesTable)
    
    // Clear questions
    await db.delete(questionsTable)

    // Clear Supabase storage bucket
    const { data: files } = await supabaseService.storage
      .from('model-answers')
      .list()

    if (files && files.length > 0) {
      const filePaths = files.map(file => file.name)
      await supabaseService.storage
        .from('model-answers')
        .remove(filePaths)
    }

    return {
      isSuccess: true,
      message: "Database cleared successfully",
      data: undefined
    }

  } catch (error) {
    console.error("Error clearing database:", error)
    return { 
      isSuccess: false, 
      message: "Failed to clear database" 
    }
  }
}

export async function getDatabaseStatsAction(): Promise<ActionState<{ questionCount: number; imageCount: number }>> {
  try {
    const questions = await db.select().from(questionsTable)
    const images = await db.select().from(modelAnswerImagesTable)
    
    const questionCount = questions.length
    const imageCount = images.length

    return {
      isSuccess: true,
      message: "Database stats retrieved successfully",
      data: { questionCount, imageCount }
    }

  } catch (error) {
    console.error("Error getting database stats:", error)
    return { 
      isSuccess: false, 
      message: "Failed to get database stats" 
    }
  }
} 