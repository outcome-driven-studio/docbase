import "@/styles/globals.css"
import { Metadata } from "next"
import Script from "next/script"
import { createClient } from "@/utils/supabase/server"

import { siteConfig } from "@/config/site"
import { validateEnvironmentVariables } from "@/lib/env-validation"
import { fontSans, fontCursive } from "@/lib/fonts"
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
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "document sharing",
    "e-signature",
    "self-hosted",
    "open source",
    "docsend alternative",
    "docusign alternative",
    "papermark alternative",
    "document analytics",
    "pdf sharing",
  ],
  authors: [
    {
      name: "Outcome Driven Studio",
    },
  ],
  creator: "Outcome Driven Studio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/api/og"],
    creator: "@alanaagoyal",
  },
  icons: {
    icon: "/favicon.ico",
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
          {/* Buy Me a Coffee Widget */}
          <Script
            data-name="BMC-Widget"
            data-cfasync="false"
            src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
            data-id="ani.ods"
            data-description="Support me on Buy me a coffee!"
            data-message="Thank you for using VibeDocs (it's free forever). Want to get my next coffee?"
            data-color="#FF813F"
            data-position="Right"
            data-x_margin="18"
            data-y_margin="18"
            strategy="lazyOnload"
          />
        </head>
        <body
          className={cn(
            "min-h-dvh bg-background font-sans antialiased",
            fontSans.variable,
            fontCursive.variable
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
