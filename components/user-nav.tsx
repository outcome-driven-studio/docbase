"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Database } from "@/types/supabase"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuItem, menuItems } from "@/config/user-nav"

type User = Database["public"]["Tables"]["users"]["Row"]

export function UserNav({ account }: { account: User }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { enabled: shortcutsEnabled } = useKeyboardShortcuts()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (shortcutsEnabled && (e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [shortcutsEnabled])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative m-2 size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarFallback>
              {account.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{account.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {account.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item: MenuItem, index: number) => (
            <div key={item.label}>
              {item.action === "logout" && <DropdownMenuSeparator />}
              {item.href ? (
                <Link href={item.href}>
                  <DropdownMenuItem className="cursor-pointer justify-between">
                    <div className="flex items-center">
                      <item.icon className="mr-2 size-4" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.shortcut}
                    </p>
                  </DropdownMenuItem>
                </Link>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer justify-between"
                  onClick={
                    item.action === "theme"
                      ? () => setTheme(theme === "light" ? "dark" : "light")
                      : item.action === "logout"
                      ? handleSignOut
                      : undefined
                  }
                >
                  <div className="flex items-center">
                    {item.action === "theme" ? (
                      theme === "light" ? (
                        <Moon className="mr-2 size-4" aria-hidden="true" />
                      ) : (
                        <Sun className="mr-2 size-4" aria-hidden="true" />
                      )
                    ) : (
                      <item.icon className="mr-2 size-4" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.shortcut}</p>
                </DropdownMenuItem>
              )}
            </div>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
