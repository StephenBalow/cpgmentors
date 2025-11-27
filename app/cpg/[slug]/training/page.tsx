"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function TrainingPage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "My CPGs", href: "/my-cpgs" },
      { label: slug.replace(/-/g, " "), href: `/cpg/${slug}` },
      { label: "Training" }
    ])
  }, [slug, setBreadcrumbs])

  return (
    <div>
      <h1 className="text-2xl font-bold">Training Modules</h1>
      <p className="text-muted-foreground mt-2">Screen 2: Choose a training module</p>
    </div>
  )
}