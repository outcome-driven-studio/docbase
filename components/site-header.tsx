"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Database } from "@/types/supabase"
import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyboardShortcutsToggle } from "@/components/keyboard-shortcuts-toggle"

import { MainNav } from "./main-nav"
import { UserNav } from "./user-nav"
import { WorkspaceSelector } from "./workspace-selector"

type User = Database["public"]["Tables"]["users"]["Row"]

export function SiteHeader({ account }: { account: User | null }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to show based on theme
  const currentTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : "light"
  const logoSrc = currentTheme === "dark" ? "/vibe-docs-white.svg" : "/vibe-docs-black.svg"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="mr-6 hidden md:flex">
            <img
              src={logoSrc}
              alt="Vibe Docs"
              className="h-8 w-auto"
            />
          </Link>
          {account ? (
            <>
              <div className="mr-2 md:hidden">
                <MainNav account={account} />
              </div>
              <div className="mt-[2px] hidden md:block">
                <MainNav account={account} />
              </div>
            </>
          ) : null}
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-block"
          >
            <div
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
              })}
            >
              <Icons.gitHub className="size-5" />
              <span className="sr-only">GitHub</span>
            </div>
          </Link>
          {account && <KeyboardShortcutsToggle />}
          <ThemeToggle />
          {account ? (
            <UserNav account={account} />
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
