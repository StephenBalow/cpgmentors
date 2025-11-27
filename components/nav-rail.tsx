"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronDown, GraduationCap, Users, ClipboardCheck, FolderOpen, User, Library, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavRailProps {
  selectedCPG?: string | null
}

const primaryNavItems = [
  { id: "training", label: "Training", icon: GraduationCap, href: "/training" },
  { id: "practice", label: "Practice", icon: Users, href: "/practice" },
  { id: "testing", label: "Testing", icon: ClipboardCheck, href: "/testing" },
]

const secondaryNavItems = [
  { id: "artifacts", label: "Artifacts", icon: FolderOpen, href: "/artifacts" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
]

const level0NavItems = [
  { id: "my-cpgs", label: "My CPGs", icon: Library, href: "/my-cpgs" },
  { id: "catalog", label: "Calalog", icon: BookOpen, href: "/catalog" },
]

export function NavRail({ selectedCPG }: NavRailProps) {
  const pathname = usePathname()
  
  // Determine if we're inside a CPG (Level 1) or at top level (Level 0)
  const isInsideCPG = pathname.startsWith("/cpg/")
  
  // Extract the CPG slug from the URL if we're inside one
  const cpgSlug = isInsideCPG ? pathname.split("/")[2] : null

  // Level 0: Not inside a CPG
  if (!isInsideCPG) {
    return (
      <aside className="fixed left-0 top-[60px] z-40 flex h-[calc(100vh-60px)] w-[100px] flex-col border-r border-border bg-slate-50">
        <nav className="flex flex-1 flex-col items-center px-2 py-4">
          <div className="flex flex-col items-center gap-1">
            {level0NavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative flex w-full flex-col items-center gap-1 rounded-md px-2 py-2.5 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="my-3 h-px w-10 bg-border" />

          <Link
            href="/profile"
            className={cn(
              "relative flex w-full flex-col items-center gap-1 rounded-md px-2 py-2.5 transition-colors",
              pathname === "/profile"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[11px] font-medium">Profile</span>
          </Link>
        </nav>
      </aside>
    )
  }

  // Level 1: Inside a CPG
  return (
    <aside className="fixed left-0 top-[60px] z-40 flex h-[calc(100vh-60px)] w-[100px] flex-col border-r border-border bg-slate-50">
      {/* CPG Selector */}
      <div className="flex flex-col items-center px-2 py-3">
        <Link 
          href={`/cpg/${cpgSlug}`}
          className="flex w-full flex-col items-center gap-0.5 rounded-md px-1 py-2 text-center transition-colors hover:bg-slate-100"
        >
          <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
            {selectedCPG || cpgSlug?.replace(/-/g, " ")}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Link>
      </div>

      <div className="mx-2 h-px bg-border" />

      {/* Primary Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-3">
        {primaryNavItems.map((item) => {
          const Icon = item.icon
          const fullHref = `/cpg/${cpgSlug}${item.href}`
          const isActive = pathname.startsWith(fullHref)
          return (
            <Link
              key={item.id}
              href={fullHref}
              className={cn(
                "relative flex w-full flex-col items-center gap-1 rounded-md px-2 py-2.5 transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        <div className="my-2 h-px w-10 bg-border" />

        {secondaryNavItems.map((item) => {
          const Icon = item.icon
          // Profile goes to /profile, artifacts stays within CPG
          const fullHref = item.id === "profile" ? "/profile" : `/cpg/${cpgSlug}${item.href}`
          const isActive = item.id === "profile" ? pathname === "/profile" : pathname.startsWith(fullHref)
          return (
            <Link
              key={item.id}
              href={fullHref}
              className={cn(
                "relative flex w-full flex-col items-center gap-1 rounded-md px-2 py-2.5 transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}