"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function TestingPage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "My CPGs", href: "/my-cpgs" },
      { label: slug.replace(/-/g, " "), href: `/cpg/${slug}` },
      { label: "Testing" }
    ])
  }, [slug, setBreadcrumbs])

  return (
    <div>
      <h1 className="text-2xl font-bold">Testing</h1>
      <p className="text-muted-foreground mt-2">Screen 6: Adaptive vs Topic-focused</p>
    </div>
  )
}