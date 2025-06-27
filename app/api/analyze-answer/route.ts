import { NextRequest, NextResponse } from 'next/server'
import { analyzeAnswerAction } from '@/lib/actions/analyze-answer'

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

    // Call the server action
    const result = await analyzeAnswerAction(formData)

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
    console.error('API route error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      },
      { 
        status: 500,
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