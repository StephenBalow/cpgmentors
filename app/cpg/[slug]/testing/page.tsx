"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Brain, ListChecks, Clock, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

const topics = [
  { id: "all", label: "All Topics", completed: false },
  { id: "red-flags", label: "Red Flags", completed: true },
  { id: "classification", label: "Classification", completed: true },
  { id: "stage", label: "Stage Determination", completed: false },
  { id: "recommendations", label: "Recommendations", completed: false },
]

const recentResults = [
  { date: "Nov 24", type: "Adaptive", score: 85, areasToReview: "Radicular symptoms" },
  { date: "Nov 20", type: "Topic: Red Flags", score: 92, areasToReview: "None" },
]

export default function TestingPage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()

  // Format CPG name
  const cpgName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Testing` },
    ])
  }, [cpgName, setBreadcrumbs])

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{cpgName} - Test Your Knowledge</h1>
        <p className="mt-1 text-muted-foreground">Choose the approach that fits your needs</p>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        {/* Adaptive Assessment Card */}
        <div className="relative flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm">
          <Badge className="absolute top-4 right-4 bg-primary/10 text-primary hover:bg-primary/10">Recommended</Badge>

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>

          <h2 className="text-lg font-medium text-foreground mb-2">Adaptive Assessment</h2>

          <p className="text-sm text-muted-foreground mb-4">
            Work with Sam to strengthen weak areas based on your Training and Practice history
          </p>

          <div className="mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>~15-20 minutes</span>
            </div>

            <Button className="w-full">Start Assessment</Button>
          </div>
        </div>

        {/* Topic-Focused Quiz Card */}
        <div className="flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <ListChecks className="h-5 w-5 text-secondary-foreground" />
          </div>

          <h2 className="text-lg font-medium text-foreground mb-2">Topic-Focused Quiz</h2>

          <p className="text-sm text-muted-foreground mb-4">
            Test your knowledge on specific topics (required for CE credits)
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((topic) => (
              <button
                key={topic.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
              >
                {topic.label}
                {topic.completed && <Check className="h-3 w-3 text-green-600" />}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>5-10 min per topic</span>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Start Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Recent Results</h3>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Areas to Review</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((result, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{result.date}</td>
                  <td className="px-4 py-3 text-foreground">{result.type}</td>
                  <td className="px-4 py-3">
                    <span className={result.score >= 90 ? "text-green-600" : "text-primary"}>{result.score}%</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{result.areasToReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline">
          View all results
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}