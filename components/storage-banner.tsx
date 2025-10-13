"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { AlertCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export function StorageBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Don't show on public pages
  const publicPages = ["/", "/login", "/signup", "/error"]
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    checkStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkStorage() {
    // Check if user dismissed banner
    const dismissed = localStorage.getItem("storage-banner-dismissed")
    if (dismissed) {
      setDismissed(true)
      return
    }

    try {
      // Try to list files in cube bucket
      const { error } = await supabase.storage.from("cube").list("", {
        limit: 1,
      })

      if (error && error.message.includes("not found")) {
        setShow(true)
      }
    } catch (error) {
      console.error("Error checking storage:", error)
      setShow(true)
    }
  }

  function handleDismiss() {
    localStorage.setItem("storage-banner-dismissed", "true")
    setDismissed(true)
    setShow(false)
  }

  if (!show || dismissed || isPublicPage) return null

  return (
    <div className="border-b bg-yellow-50 dark:bg-yellow-950">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Storage not configured yet. Set up storage to upload documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/workspaces/settings#storage")}
            className="border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-200 dark:hover:bg-yellow-900"
          >
            Set Up Storage
          </Button>
          <button
            onClick={handleDismiss}
            className="rounded p-1 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
