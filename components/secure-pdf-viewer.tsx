"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import { clientLogger } from "@/lib/client-logger"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface SecurePDFViewerProps {
  linkId: string
  filename: string
  allowDownload: boolean
}

export default function SecurePDFViewer({
  linkId,
  filename,
  allowDownload,
}: SecurePDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true)

  async function handleDownload() {
    try {
      const response = await fetch(`/api/view-document/${linkId}`)
      if (!response.ok) {
        throw new Error("Failed to download document")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        description: "Document downloaded successfully",
      })
    } catch (error: any) {
      clientLogger.error("Error downloading document", { error })
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  // Disable right-click on the iframe
  const disableContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Controls */}
      <div className="sticky top-0 z-10 w-full bg-background border-b p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{filename}</span>
        </div>

        <div className="flex items-center gap-2">
          {allowDownload && (
            <Button onClick={handleDownload} variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer - Using native browser viewer */}
      <div
        className="flex flex-col items-center w-full bg-gray-100 dark:bg-gray-900 min-h-screen"
        onContextMenu={disableContextMenu}
      >
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        )}

        <iframe
          src={`/api/view-document/${linkId}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-screen border-0"
          title={filename}
          onLoad={() => setLoading(false)}
          style={{
            minHeight: "calc(100vh - 80px)",
          }}
        />
      </div>
    </div>
  )
}
