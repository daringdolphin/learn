"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabaseAction, clearDatabaseAction, getDatabaseStatsAction } from "@/actions/db/seed-actions"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Stats {
  questionCount: number
  imageCount: number
}

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const handleSeed = async () => {
    setIsSeeding(true)
    setLastResult(null)
    
    try {
      const result = await seedDatabaseAction()
      if (result.isSuccess) {
        setLastResult(`✅ ${result.message}`)
        await loadStats() // Refresh stats after seeding
      } else {
        setLastResult(`❌ ${result.message}`)
      }
    } catch (error) {
      setLastResult(`❌ Failed to seed database: ${error}`)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      return
    }
    
    setIsClearing(true)
    setLastResult(null)
    
    try {
      const result = await clearDatabaseAction()
      if (result.isSuccess) {
        setLastResult(`✅ ${result.message}`)
        await loadStats() // Refresh stats after clearing
      } else {
        setLastResult(`❌ ${result.message}`)
      }
    } catch (error) {
      setLastResult(`❌ Failed to clear database: ${error}`)
    } finally {
      setIsClearing(false)
    }
  }

  const loadStats = async () => {
    setIsLoadingStats(true)
    
    try {
      const result = await getDatabaseStatsAction()
      if (result.isSuccess) {
        setStats(result.data)
      } else {
        setLastResult(`❌ ${result.message}`)
      }
    } catch (error) {
      setLastResult(`❌ Failed to load stats: ${error}`)
    } finally {
      setIsLoadingStats(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Seeding Interface</h1>
          <p className="text-muted-foreground mt-2">
            Manage chemistry exam questions and model answers in the database
          </p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>Current database content overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={loadStats}
                disabled={isLoadingStats}
              >
                {isLoadingStats && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh Stats
              </Button>
              
              {stats && (
                <div className="flex gap-3">
                  <Badge variant="secondary">
                    Questions: {stats.questionCount}
                  </Badge>
                  <Badge variant="secondary">
                    Images: {stats.imageCount}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Database Actions</CardTitle>
            <CardDescription>
              Seed the database with sample questions or clear all data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSeed}
                disabled={isSeeding || isClearing}
                className="flex-1"
              >
                {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Seed Database
              </Button>
              
              <Button 
                variant="destructive"
                onClick={handleClear}
                disabled={isSeeding || isClearing}
                className="flex-1"
              >
                {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {lastResult && (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{lastResult}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Seed Database:</strong> Processes the JSON file in `db/seed/model-answers.json` and uploads images from `db/seed/question-images/` to Supabase storage</p>
            <p>• <strong>Clear Database:</strong> Removes all questions, images, and clears the Supabase storage bucket</p>
            <p>• <strong>Refresh Stats:</strong> Shows current count of questions and images in the database</p>
            <p>• Make sure your Supabase credentials are properly configured in `.env.local`</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 