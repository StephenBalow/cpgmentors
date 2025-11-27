import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { NavRail } from "@/components/nav-rail"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CPGmentors",
  description: "AI-powered clinical practice guideline mentorship",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Full-width header at top */}
        <Header />
        
        {/* Nav rail and content below header */}
        <div className="flex pt-[60px]">
          <NavRail />
          
          {/* Main content - offset by nav rail width */}
          <main className="ml-[70px] flex-1 min-h-[calc(100vh-60px)] bg-slate-50 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
