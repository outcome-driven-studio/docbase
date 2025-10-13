"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function StorageStatusBadge() {
  const supabase = createClient()
  const [status, setStatus] = useState<
    "checking" | "connected" | "not-connected"
  >("checking")

  useEffect(() => {
    checkStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkStorage() {
    try {
      // Try to list files in the cube bucket - if this works, bucket exists and is accessible
      const { data, error } = await supabase.storage.from("cube").list("", {
        limit: 1,
      })

      if (error) {
        // If error is "Bucket not found", then not connected
        if (error.message.includes("not found")) {
          setStatus("not-connected")
        } else {
          // Other errors might mean it exists but has permission issues
          console.log("Storage check error:", error)
          setStatus("not-connected")
        }
      } else {
        // Successfully listed (even if empty) - bucket exists!
        setStatus("connected")
      }
    } catch (error) {
      console.error("Error checking storage:", error)
      setStatus("not-connected")
    }
  }

  if (status === "checking") {
    return <Badge variant="outline">Checking...</Badge>
  }

  if (status === "connected") {
    return (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle2 className="mr-1 size-3" />
        Connected
      </Badge>
    )
  }

  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 size-3" />
      Not Connected
    </Badge>
  )
}
