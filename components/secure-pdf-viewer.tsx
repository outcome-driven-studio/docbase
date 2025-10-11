"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { clientLogger } from "@/lib/client-logger"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

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
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    clientLogger.error("Error loading PDF", { error })
    toast({
      title: "Error",
      description: "Failed to load document",
      variant: "destructive",
    })
    setLoading(false)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0))
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5))
  }

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

  // Disable right-click and keyboard shortcuts
  const disableContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Controls */}
      <div className="sticky top-0 z-10 w-full bg-background border-b p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={zoomOut} variant="outline" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button onClick={zoomIn} variant="outline" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Button>

          {allowDownload && (
            <Button onClick={handleDownload} variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        className="flex flex-col items-center w-full py-8 bg-gray-100 dark:bg-gray-900 min-h-screen"
        onContextMenu={disableContextMenu}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        )}

        <Document
          file={`/api/view-document/${linkId}`}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="shadow-lg"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}
