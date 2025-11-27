"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useBreadcrumbs } from "@/components/breadcrumb-context"
import { cn } from "@/lib/utils"

interface CPG {
  id: string
  title: string
  source: string
  year: string
  progress: number
  status: "continue" | "start"
  lastActivity?: string
  bodyRegion: string
  bodyRegionColor: "blue" | "green" | "purple"
}

const cpgs: CPG[] = [
  {
    id: "neck-pain",
    title: "Neck Pain",
    source: "APTA",
    year: "2017",
    progress: 65,
    status: "continue",
    lastActivity: "Nov 26",
    bodyRegion: "Cervical",
    bodyRegionColor: "blue",
  },
  {
    id: "low-back-pain",
    title: "Low Back Pain",
    source: "APTA",
    year: "2021",
    progress: 20,
    status: "continue",
    lastActivity: "Nov 20",
    bodyRegion: "Lumbar",
    bodyRegionColor: "green",
  },
  {
    id: "shoulder-pain",
    title: "Shoulder Pain",
    source: "APTA",
    year: "2023",
    progress: 0,
    status: "start",
    bodyRegion: "Upper Extremity",
    bodyRegionColor: "purple",
  },
]

const bodyRegionColors = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
}

const bodyIcons: Record<string, React.ReactNode> = {
  "neck-pain": (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="14" r="8" className="stroke-primary" strokeWidth="2" />
      <path d="M24 22 L24 36" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 28 L24 26 L30 28" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "low-back-pain": (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="10" r="5" className="stroke-primary" strokeWidth="2" />
      <path d="M24 15 L24 38" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 32 L28 32" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 38 L24 38 L30 38" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "shoulder-pain": (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="12" r="6" className="stroke-primary" strokeWidth="2" />
      <path d="M24 18 L24 36" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 24 L24 20 L36 24" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export default function MyCPGsPage() {
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([{ label: "My CPGs" }])
  }, [setBreadcrumbs])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">My CPGs</h1>
        <p className="mt-1 text-muted-foreground">Continue your learning journey</p>
      </div>

      {/* CPG Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cpgs.map((cpg) => (
          <Link
            key={cpg.id}
            href={`/cpg/${cpg.id}`}
            className="group relative flex flex-col items-start rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-md"
          >
            <span
              className={cn(
                "absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                bodyRegionColors[cpg.bodyRegionColor]
              )}
            >
              {cpg.bodyRegion}
            </span>

            {/* Icon */}
            <div className="mb-4 rounded-lg bg-primary/10 p-2">{bodyIcons[cpg.id]}</div>

            {/* Title and source */}
            <h3 className="text-lg font-semibold text-foreground">{cpg.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {cpg.source} {cpg.year}
            </p>

            {/* Progress bar */}
            <div className="mt-4 w-full">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium text-foreground">{cpg.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${cpg.progress}%` }}
                />
              </div>
            </div>

            {/* Action button and last activity */}
            <div className="mt-4 flex w-full items-center justify-between">
              <span
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  cpg.status === "continue"
                    ? "bg-primary text-primary-foreground group-hover:bg-primary/90"
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}
              >
                {cpg.status === "continue" ? "Continue Learning" : "Start"}
              </span>
              {cpg.lastActivity && (
                <span className="text-xs text-muted-foreground">Last: {cpg.lastActivity}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}