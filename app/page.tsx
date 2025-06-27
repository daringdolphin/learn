"use server"

import { Suspense } from "react"
import { getAllQuestionsAction } from "@/actions/db/questions-actions"
import { QuestionGrid } from "@/app/_components/question-grid"
import { QuestionGridSkeleton } from "@/app/_components/question-grid-skeleton"

export default async function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Get Feedback for Sec 4 Chem Mock Exam
          </h1>
          <p className="text-lg text-gray-600">
            It's (kinda) not your fault; never lose marks for dumb reasons again.
          </p>
        </div>

        {/* Questions Grid */}
        <Suspense fallback={<QuestionGridSkeleton />}>
          <QuestionGridFetcher />
        </Suspense>
      </div>
    </div>
  )
}

async function QuestionGridFetcher() {
  const { data: questions, isSuccess } = await getAllQuestionsAction()
  
  if (!isSuccess || !questions) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No questions available. Please seed the database first.</p>
      </div>
    )
  }

  return <QuestionGrid questions={questions} />
}