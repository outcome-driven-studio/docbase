import "@/styles/globals.css"
import { Metadata } from "next"
import Script from "next/script"
import { createClient } from "@/utils/supabase/server"

import { siteConfig } from "@/config/site"
import { validateEnvironmentVariables } from "@/lib/env-validation"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { CommandMenu } from "@/components/command-menu"
import { SiteHeader } from "@/components/site-header"
import { StorageBanner } from "@/components/storage-banner"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts-context"

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.tagline,
  openGraph: {
    images: ["/api/og"],
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  validateEnvironmentVariables()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let account = null

  if (user) {
    // Use service role to bypass RLS for layout query
    const { data: accountData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Layout: Error fetching account:", error)
    } else {
      console.log("Layout: Account fetched:", accountData?.email)
      account = accountData
    }
  } else {
    console.log("Layout: No user authenticated")
  }

  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
            strategy="beforeInteractive"
          />
        </head>
        <body
          className={cn(
            "min-h-dvh bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <KeyboardShortcutsProvider>
              <div className="relative flex min-h-dvh flex-col">
                <SiteHeader account={account} />
                {account && <StorageBanner />}
                <Toaster />
                {children}
                <CommandMenu />
                <div className="flex-1"></div>
              </div>
              <TailwindIndicator />
            </KeyboardShortcutsProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
