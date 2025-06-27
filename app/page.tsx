"use server"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Chemistry Exam Analysis Tool</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered feedback for Secondary-4 chemistry exam answers
          </p>
        </div>

        <div className="grid gap-4">
          <Button asChild size="lg">
            <Link href="/seed">Database Seeding Interface</Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Use the seeding interface to populate the database with sample chemistry questions and model answers.
          </p>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Development Setup</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Configure your Supabase credentials in `.env.local`</li>
            <li>Create a "model-answers" bucket in Supabase Storage (public access)</li>
            <li>Run database migrations: `pnpm db:migrate`</li>
            <li>Use the seeding interface to populate sample data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}