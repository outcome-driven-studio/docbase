"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import { clientLogger } from "@/lib/client-logger"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface SecurePDFViewerProps {
  linkId: string
  filename: string
  allowDownload: boolean
  displayMode?: "auto" | "slideshow" | "document"
  logoUrl?: string | null
  pageHeading?: string | null
}

export default function SecurePDFViewer({
  linkId,
  filename,
  allowDownload,
  displayMode = "auto",
  logoUrl,
  pageHeading,
}: SecurePDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [isSlideshow, setIsSlideshow] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch PDF URL
    setPdfUrl(`/api/view-document/${linkId}`)

    // Auto-detect orientation if displayMode is "auto"
    if (displayMode === "auto") {
      detectOrientation()
    } else if (displayMode === "slideshow") {
      setIsSlideshow(true)
    }
  }, [displayMode, linkId])

  useEffect(() => {
    // Update page width when container size changes
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  async function detectOrientation() {
    try {
      const response = await fetch(`/api/view-document/${linkId}`)
      const blob = await response.blob()

      const reader = new FileReader()
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer)
        const pdf = await pdfjs.getDocument(typedArray).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })

        // If landscape (width > height), use slideshow mode
        if (viewport.width > viewport.height) {
          setIsSlideshow(true)
        }
      }
      reader.readAsArrayBuffer(blob)
    } catch (error) {
      clientLogger.error("Error detecting PDF orientation", { error })
      setIsSlideshow(false)
    }
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

  // Disable right-click on the iframe
  const disableContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // Navigation handlers for slideshow
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setTotalPages(numPages)
    setLoading(false)
  }

  // Keyboard navigation for slideshow
  useEffect(() => {
    if (!isSlideshow) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        goToNextPage()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goToPrevPage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSlideshow, currentPage, totalPages])

  return (
    <div className="flex w-full flex-col items-center">
      {/* Controls */}
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center justify-between gap-4 border-b bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {isSlideshow && (
            <>
              <Button
                onClick={goToPrevPage}
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                onClick={goToNextPage}
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          {allowDownload && (
            <Button onClick={handleDownload} variant="default" size="sm">
              <Download className="mr-2 size-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        className="flex w-full flex-col items-center bg-gray-100 dark:bg-gray-900"
        onContextMenu={disableContextMenu}
        style={{
          overflow: isSlideshow ? "hidden" : "auto",
        }}
      >
        {loading && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        )}

        {isSlideshow ? (
          <div
            ref={containerRef}
            className="flex w-full items-center justify-center bg-gray-100 dark:bg-gray-900"
            style={{
              height: "calc(100vh - 80px)",
              overflow: "hidden",
            }}
          >
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">
                        Loading presentation...
                      </p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  height={window.innerHeight - 80}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="max-w-full"
                  loading={
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">
                          Loading slide {currentPage}...
                        </p>
                      </div>
                    </div>
                  }
                />
              </Document>
            )}
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`/api/view-document/${linkId}#toolbar=${
              allowDownload ? "1" : "0"
            }&navpanes=0`}
            className="h-screen w-full border-0"
            title={filename}
            onLoad={() => setLoading(false)}
            style={{
              minHeight: "calc(100vh - 80px)",
              overflow: "auto",
            }}
          />
        )}
      </div>
    </div>
  )
}
