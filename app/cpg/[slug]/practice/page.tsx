"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function PracticePage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "My CPGs", href: "/my-cpgs" },
      { label: slug.replace(/-/g, " "), href: `/cpg/${slug}` },
      { label: "Practice" }
    ])
  }, [slug, setBreadcrumbs])

  return (
    <div>
      <h1 className="text-2xl font-bold">Practice Cases</h1>
      <p className="text-muted-foreground mt-2">Screen 4: Patient case cards</p>
    </div>
  )
}