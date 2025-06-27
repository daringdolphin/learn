import { NextResponse } from 'next/server'
import { db } from '@/db/db'
import { questionsTable, modelAnswerImagesTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { supabase } from '@/lib/api/supabase'
import type { ModelAnswerResponse } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params

    // Fetch question data using Drizzle ORM
    const question = await db.query.questions.findFirst({
      where: eq(questionsTable.id, questionId)
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Fetch associated model answer images using Drizzle ORM
    const modelAnswerImages = await db.query.modelAnswerImages.findMany({
      where: eq(modelAnswerImagesTable.questionId, questionId),
      orderBy: modelAnswerImagesTable.position
    })

    // Construct full CDN URLs for images using Supabase Storage
    const modelAnswerImgUrls = modelAnswerImages.map(image => {
      const { data } = supabase.storage
        .from('model-answers')
        .getPublicUrl(image.imgKey)
      
      return data.publicUrl
    })

    // Prepare structured response
    const response: ModelAnswerResponse = {
      modelAnswerImgUrls,
      modelAnswerJson: question.modelAnswerJson as any
    }

    // Return with caching headers for performance
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error fetching model answer:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 