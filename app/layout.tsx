/*
<ai_context>
The root server layout for the app.
</ai_context>
*/

// Server component - runs on server by default in App Router

import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chemistry Exam Analysis Tool",
  description: "AI-powered chemistry exam analysis tool for Secondary-4 students",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChemExam"
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6"
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
          inter.className
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}

          <TailwindIndicator />

          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
