import { NextRequest, NextResponse } from 'next/server'
import { analyzeAnswerAction } from '@/lib/actions/analyze-answer'
import { createErrorResponse, logError } from '@/lib/utils/error-handling'
import { ModelProvider } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          message: 'Expected multipart/form-data with questionId and image fields'
        },
        { status: 400 }
      )
    }

    // Extract model provider from query parameters or headers
    const modelProvider = request.nextUrl.searchParams.get('modelProvider') as ModelProvider || 
                         request.headers.get('x-model-provider') as ModelProvider

    // Call the server action
    const result = await analyzeAnswerAction(formData, modelProvider)

    // Handle different response scenarios
    if (result.isSuccess) {
      return NextResponse.json(result.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } else {
      // Determine appropriate HTTP status code based on error message
      let statusCode = 500 // Default to internal server error

      if (result.message.includes('required') || 
          result.message.includes('Invalid file type') ||
          result.message.includes('File size too large') ||
          result.message.includes('file is empty')) {
        statusCode = 400 // Bad Request
      } else if (result.message.includes('Question not found')) {
        statusCode = 404 // Not Found
      } else if (result.message.includes('Unable to read the handwriting')) {
        statusCode = 422 // Unprocessable Entity
      } else if (result.message.includes('took too long') || result.message.includes('timed out')) {
        statusCode = 504 // Gateway Timeout
      } else if (result.message.includes('Service is currently busy') || 
                 result.message.includes('Rate limit exceeded')) {
        statusCode = 429 // Too Many Requests
      } else if (result.message.includes('Image is too large')) {
        statusCode = 413 // Payload Too Large
      }

      return NextResponse.json(
        { 
          error: result.message,
          message: result.message
        },
        { 
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      )
    }

  } catch (error) {
    // Log the error with context
    logError(error instanceof Error ? error : new Error(String(error)), 'API /analyze-answer')
    
    // Create a standardized error response
    const errorResponse = createErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      500
    )
    
    return NextResponse.json(
      errorResponse,
      { 
        status: errorResponse.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  })
} 