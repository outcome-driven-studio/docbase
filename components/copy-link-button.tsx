"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        description: "Link copied to clipboard",
      })
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="size-4" />
    </Button>
  )
}
