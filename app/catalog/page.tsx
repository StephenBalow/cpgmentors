"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

type BodyRegion = "all" | "cervical" | "lumbar" | "upper-extremity" | "lower-extremity"
type CPGStatus = "owned" | "available" | "coming-soon"

interface CPG {
  id: string
  title: string
  source: string
  year: string
  bodyRegion: string
  bodyRegionKey: BodyRegion
  bodyRegionColor: "blue" | "green" | "purple" | "orange"
  status: CPGStatus
  price?: string
  bundleNote?: string
  comingSoon?: string
}

const allCPGs: CPG[] = [
  {
    id: "neck-pain",
    title: "Neck Pain",
    source: "APTA",
    year: "2017",
    bodyRegion: "Cervical",
    bodyRegionKey: "cervical",
    bodyRegionColor: "blue",
    status: "owned",
  },
  {
    id: "low-back-pain",
    title: "Low Back Pain",
    source: "APTA",
    year: "2021",
    bodyRegion: "Lumbar",
    bodyRegionKey: "lumbar",
    bodyRegionColor: "green",
    status: "owned",
  },
  {
    id: "shoulder-pain",
    title: "Shoulder Pain",
    source: "APTA",
    year: "2023",
    bodyRegion: "Upper Extremity",
    bodyRegionKey: "upper-extremity",
    bodyRegionColor: "purple",
    status: "owned",
  },
  {
    id: "knee-pain",
    title: "Knee Pain",
    source: "APTA",
    year: "2021",
    bodyRegion: "Lower Extremity",
    bodyRegionKey: "lower-extremity",
    bodyRegionColor: "orange",
    status: "available",
    price: "$49",
    bundleNote: "Included in Lower Extremity Bundle",
  },
  {
    id: "hip-pain",
    title: "Hip Pain",
    source: "APTA",
    year: "2022",
    bodyRegion: "Lower Extremity",
    bodyRegionKey: "lower-extremity",
    bodyRegionColor: "orange",
    status: "available",
    price: "$49",
  },
  {
    id: "thoracic-pain",
    title: "Thoracic Pain",
    source: "APTA",
    year: "2024",
    bodyRegion: "Thoracic",
    bodyRegionKey: "cervical",
    bodyRegionColor: "blue",
    status: "available",
    price: "$49",
  },
  {
    id: "ankle-foot",
    title: "Ankle & Foot",
    source: "APTA",
    year: "2025",
    bodyRegion: "Lower Extremity",
    bodyRegionKey: "lower-extremity",
    bodyRegionColor: "orange",
    status: "coming-soon",
    comingSoon: "Coming Q1 2025",
  },
  {
    id: "wrist-hand",
    title: "Wrist & Hand",
    source: "APTA",
    year: "2025",
    bodyRegion: "Upper Extremity",
    bodyRegionKey: "upper-extremity",
    bodyRegionColor: "purple",
    status: "coming-soon",
    comingSoon: "Coming Q2 2025",
  },
]

const filterOptions: { id: BodyRegion; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cervical", label: "Cervical" },
  { id: "lumbar", label: "Lumbar" },
  { id: "upper-extremity", label: "Upper Extremity" },
  { id: "lower-extremity", label: "Lower Extremity" },
]

const bodyRegionColors = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
  orange: "bg-orange-50 text-orange-600 border-orange-200",
}

// Simple placeholder icon component
function BodyIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-lg", className)}>
      ⚕
    </div>
  )
}

export default function CatalogPage() {
  const { setBreadcrumbs } = useBreadcrumbs()
  const [activeFilter, setActiveFilter] = useState<BodyRegion>("all")

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Browse All CPGs' },
    ])
  }, [setBreadcrumbs])

  const filteredCPGs = allCPGs.filter((cpg) => activeFilter === "all" || cpg.bodyRegionKey === activeFilter)

  const ownedCPGs = filteredCPGs.filter((cpg) => cpg.status === "owned")
  const availableCPGs = filteredCPGs.filter((cpg) => cpg.status === "available")
  const comingSoonCPGs = filteredCPGs.filter((cpg) => cpg.status === "coming-soon")

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Browse All CPGs</h1>
        <p className="mt-1 text-muted-foreground">Expand your clinical expertise</p>
      </div>

      {/* Bundle Promotion Banner */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">Lower Extremity Bundle</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Save 20%
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Includes: Knee, Hip, Ankle & Foot</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-lg font-semibold text-foreground">$99</span>
              <span className="ml-2 text-sm text-muted-foreground line-through">$147</span>
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Purchase Bundle
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex gap-2">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === filter.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Owned CPGs Section */}
      {ownedCPGs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Owned</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ownedCPGs.map((cpg) => (
              <Link
                key={cpg.id}
                href={`/cpg/${cpg.id}`}
                className="group relative flex flex-col items-start rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Body Region Tag */}
                <span
                  className={cn(
                    "absolute right-4 top-4 rounded-full border px-2 py-0.5 text-xs font-medium",
                    bodyRegionColors[cpg.bodyRegionColor],
                  )}
                >
                  {cpg.bodyRegion}
                </span>

                {/* Icon */}
                <BodyIcon />

                {/* Title and source */}
                <h3 className="mt-3 text-base font-semibold text-foreground">{cpg.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {cpg.source} {cpg.year}
                </p>

                {/* Status and Action */}
                <div className="mt-4 flex w-full items-center justify-between">
                  <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    Owned
                  </span>
                  <span className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors group-hover:bg-primary/20">
                    Open
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Available CPGs Section */}
      {availableCPGs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Available</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCPGs.map((cpg) => (
              <div
                key={cpg.id}
                className="relative flex flex-col items-start rounded-xl border border-border bg-card p-5"
              >
                {/* Body Region Tag */}
                <span
                  className={cn(
                    "absolute right-4 top-4 rounded-full border px-2 py-0.5 text-xs font-medium",
                    bodyRegionColors[cpg.bodyRegionColor],
                  )}
                >
                  {cpg.bodyRegion}
                </span>

                {/* Icon */}
                <BodyIcon />

                {/* Title and source */}
                <h3 className="mt-3 text-base font-semibold text-foreground">{cpg.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {cpg.source} {cpg.year}
                </p>

                {/* Price */}
                <div className="mt-3">
                  <span className="text-lg font-semibold text-foreground">{cpg.price}</span>
                  {cpg.bundleNote && <p className="mt-0.5 text-xs text-muted-foreground">{cpg.bundleNote}</p>}
                </div>

                {/* Action */}
                <button className="mt-4 w-full rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                  Purchase
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon CPGs Section */}
      {comingSoonCPGs.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Coming Soon</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comingSoonCPGs.map((cpg) => (
              <div
                key={cpg.id}
                className="relative flex flex-col items-start rounded-xl border border-border bg-card p-5 opacity-60"
              >
                {/* Body Region Tag */}
                <span
                  className={cn(
                    "absolute right-4 top-4 rounded-full border px-2 py-0.5 text-xs font-medium opacity-50",
                    bodyRegionColors[cpg.bodyRegionColor],
                  )}
                >
                  {cpg.bodyRegion}
                </span>

                {/* Icon */}
                <BodyIcon className="opacity-50" />

                {/* Title and source */}
                <h3 className="mt-3 text-base font-semibold text-foreground">{cpg.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{cpg.comingSoon}</p>

                {/* Action */}
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Bell className="h-4 w-4" />
                  Notify Me
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}