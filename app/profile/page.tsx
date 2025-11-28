"use client"

import { useEffect } from "react"
import { Mail, Building2, Award, ExternalLink, Download, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBreadcrumbs } from "@/components/breadcrumb-context"

export default function ProfilePage() {
  const { setBreadcrumbs } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Profile' },
    ])
  }, [setBreadcrumbs])

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Your Profile</h1>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              JD
            </div>

            {/* User Details */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">John Doe</h2>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>john.doe@example.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Physical Therapist, DPT</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Summit Physical Therapy</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Professional</span>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Renews Dec 26, 2025</p>
            </div>
            <Button variant="link" className="h-auto p-0 text-sm text-primary">
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Learning Stats</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">12.5</p>
              <p className="text-xs text-muted-foreground">Hours</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">CPGs Started</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">CPGs Completed</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Cases Completed</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">87%</p>
              <p className="text-xs text-muted-foreground">Avg Test Score</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Artifacts Saved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CE Credits Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">CE Credits</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-foreground">
                4.5 <span className="text-base font-normal text-muted-foreground">CEUs</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Credits earned</p>
            </div>
            <div className="flex gap-3">
              <Button variant="link" className="h-auto gap-1.5 p-0 text-sm text-primary">
                <ExternalLink className="h-3.5 w-3.5" />
                View certificates
              </Button>
              <Button variant="link" className="h-auto gap-1.5 p-0 text-sm text-primary">
                <Download className="h-3.5 w-3.5" />
                Download transcript
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2">
            <Button
              variant="link"
              className="h-auto justify-start p-0 text-sm text-muted-foreground hover:text-foreground"
            >
              Notification preferences
            </Button>
            <Button
              variant="link"
              className="h-auto justify-start p-0 text-sm text-muted-foreground hover:text-foreground"
            >
              Email settings
            </Button>
            <div className="mt-4 border-t pt-4">
              <Button
                variant="ghost"
                className="h-auto gap-2 p-0 text-sm text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}