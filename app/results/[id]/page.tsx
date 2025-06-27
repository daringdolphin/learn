"use server"

import { Suspense } from "react"
import { getQuestionByIdAction } from "@/actions/db/questions-actions"
import { ResultsDisplay } from "../_components/results-display"
import { ResultsDisplaySkeleton } from "../_components/results-display-skeleton"
import { notFound } from "next/navigation"

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<ResultsDisplaySkeleton />}>
          <ResultsDisplayFetcher questionId={id} />
        </Suspense>
      </div>
    </div>
  )
}

async function ResultsDisplayFetcher({ questionId }: { questionId: string }) {
  const { data: question, isSuccess } = await getQuestionByIdAction(questionId)
  
  if (!isSuccess || !question) {
    notFound()
  }

  return <ResultsDisplay question={question} />
} 