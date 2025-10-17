"use client"

import Link from "next/link"

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
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="mr-6 hidden text-2xl font-semibold md:flex">
            <span
              style={{
                backgroundImage:
                  "linear-gradient(48deg, #74EBD5 0%, #9FACE6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Doc
            </span>
            base
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
