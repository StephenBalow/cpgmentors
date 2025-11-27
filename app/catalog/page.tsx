"use client"

import { useEffect } from "react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function BrowsePage() {
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Catalog" },
    ])
  }, [setBreadcrumbs])

  return (
    <div>
      <h1 className="text-2xl font-bold">CPG Catalog</h1>
      <p className="text-muted-foreground mt-2">Screen 9: Browse and purchase CPGs</p>
    </div>
  )
}