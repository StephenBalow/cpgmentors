"use client"

import { useEffect } from "react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function MyCPGsPage() {
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: "My CPGs" }
    ])
  }, [setBreadcrumbs])

  return (
    <div>
      <h1 className="text-2xl font-bold">My CPGs</h1>
      <p className="text-muted-foreground mt-2">Screen 8: Your purchased CPG library</p>
    </div>
  )
}