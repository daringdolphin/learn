"use server"

import { Suspense } from "react"
import { getQuestionByIdAction } from "@/actions/db/questions-actions"
import { QuestionAnalysis } from "../_components/question-analysis"
import { QuestionAnalysisSkeleton } from "../_components/question-analysis-skeleton"
import { notFound } from "next/navigation"

interface QuestionPageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<QuestionAnalysisSkeleton />}>
          <QuestionAnalysisFetcher questionId={id} />
        </Suspense>
      </div>
    </div>
  )
}

async function QuestionAnalysisFetcher({ questionId }: { questionId: string }) {
  const { data: question, isSuccess } = await getQuestionByIdAction(questionId)
  
  if (!isSuccess || !question) {
    notFound()
  }

  return <QuestionAnalysis question={question} />
} 