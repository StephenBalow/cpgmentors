"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { FileText, CheckSquare, ClipboardList, Download, Trash2, Eye } from "lucide-react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

type ArtifactSource = "training" | "practice" | "testing"
type FilterTab = "all" | ArtifactSource

interface Artifact {
  id: string
  title: string
  type: "document" | "checklist" | "case-summary" | "results"
  source: ArtifactSource
  date: string
  description: string
}

const artifacts: Artifact[] = [
  {
    id: "1",
    title: "Red Flags Checklist",
    type: "checklist",
    source: "training",
    date: "Nov 26, 2024",
    description: "13 red flags for neck pain screening",
  },
  {
    id: "2",
    title: "Sarah Martinez - Case Summary",
    type: "case-summary",
    source: "practice",
    date: "Nov 26, 2024",
    description: "Mobility deficits, acute stage, your clinical reasoning",
  },
  {
    id: "3",
    title: "Classification Decision Tree",
    type: "document",
    source: "training",
    date: "Nov 24, 2024",
    description: "4 neck pain classifications with key indicators",
  },
  {
    id: "4",
    title: "Adaptive Assessment Results",
    type: "results",
    source: "testing",
    date: "Nov 24, 2024",
    description: "Score: 85% - Review: Radicular symptoms",
  },
  {
    id: "5",
    title: "Michael Chen - Case Summary",
    type: "case-summary",
    source: "practice",
    date: "Nov 25, 2024",
    description: "In progress - Classification step",
  },
]

const sourceColors: Record<ArtifactSource, { bg: string; text: string }> = {
  training: { bg: "bg-blue-100", text: "text-blue-700" },
  practice: { bg: "bg-green-100", text: "text-green-700" },
  testing: { bg: "bg-purple-100", text: "text-purple-700" },
}

function getTypeIcon(type: Artifact["type"]) {
  switch (type) {
    case "checklist":
      return <CheckSquare className="h-5 w-5" />
    case "case-summary":
      return <ClipboardList className="h-5 w-5" />
    case "results":
      return <FileText className="h-5 w-5" />
    case "document":
    default:
      return <FileText className="h-5 w-5" />
  }
}

export default function ArtifactsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")

  // Format CPG name
  const cpgName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Artifacts` },
    ])
  }, [cpgName, setBreadcrumbs])

  const filteredArtifacts = activeFilter === "all" ? artifacts : artifacts.filter((a) => a.source === activeFilter)

  const tabs: { value: FilterTab; label: string }[] = [
    { value: "all", label: "All" },
    { value: "training", label: "Training" },
    { value: "practice", label: "Practice" },
    { value: "testing", label: "Testing" },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{cpgName} - Your Artifacts</h1>
        <p className="text-muted-foreground mt-1">Saved materials from your learning journey</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeFilter === tab.value ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeFilter === tab.value && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Artifact Cards */}
      <div className="flex flex-col gap-3">
        {filteredArtifacts.map((artifact) => (
          <div
            key={artifact.id}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">{getTypeIcon(artifact.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">{artifact.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${sourceColors[artifact.source].bg} ${sourceColors[artifact.source].text}`}
                  >
                    {artifact.source}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{artifact.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{artifact.date}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArtifacts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No artifacts found for this filter.</p>
        </div>
      )}
    </div>
  )
}