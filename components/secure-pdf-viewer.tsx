"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import Image from "next/image"

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
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center justify-between gap-2 border-b bg-background shadow-sm sm:gap-4">
        {isSlideshow && (
          <div className="flex w-full items-center justify-center gap-3 sm:gap-6 pt-2">
            {/* Center - Browser tab style with logo and filename */}
            {(logoUrl || pageHeading || filename) && (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-t-lg px-4 py-2 shadow-sm max-w-xs sm:max-w-md">
                {logoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={22}
                      height={22}
                      className="h-6 w-6 object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                  {pageHeading || filename}
                </span>
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-800 border border-gray-200 rounded-lg px-2 py-1">
                  <span className="text-xs text-white sm:text-sm">
                    {currentPage} / {totalPages}
                  </span>
                </div>
              </div>
            )}

            {/* Right side - Download button */}
            {allowDownload && (
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 border border-gray-200 rounded-lg px-2 py-2">
                <Button
                  onClick={handleDownload}
                  variant="default"
                  size="sm"
                  className="h-8 sm:h-9"
                >
                  <Download className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            )}
          </div>
        )}
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
            <p className="text-sm text-muted-foreground sm:text-base">
              Loading document...
            </p>
          </div>
        )}

        {isSlideshow ? (
          <div
            ref={containerRef}
            className="relative flex w-full items-center justify-center bg-gray-100 p-2 dark:bg-gray-900 sm:p-4"
            style={{
              minHeight: "calc(100vh - 60px)",
              maxHeight: "calc(100vh - 60px)",
              overflow: "hidden",
            }}
          >
            {/* Left Navigation Overlay */}
            <Button
              onClick={goToPrevPage}
              variant="ghost"
              disabled={currentPage === 1}
              className="absolute left-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm transition-all hover:bg-black/40 disabled:opacity-30 sm:left-4 sm:h-16 sm:w-16"
            >
              <ChevronLeft className="size-6 sm:size-8" />
            </Button>

            {/* Right Navigation Overlay */}
            <Button
              onClick={goToNextPage}
              variant="ghost"
              disabled={currentPage === totalPages}
              className="absolute right-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm transition-all hover:bg-black/40 disabled:opacity-30 sm:right-4 sm:h-16 sm:w-16"
            >
              <ChevronRight className="size-6 sm:size-8" />
            </Button>

            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent sm:size-8" />
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Loading presentation...
                      </p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  width={
                    containerRef.current
                      ? Math.min(containerRef.current.offsetWidth - 32, 1200)
                      : undefined
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="max-h-full max-w-full shadow-lg"
                  loading={
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent sm:size-8" />
                        <p className="text-xs text-muted-foreground sm:text-sm">
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
          <div className="w-full max-w-7xl px-2 sm:px-4">
            <iframe
              ref={iframeRef}
              src={`/api/view-document/${linkId}#toolbar=${
                allowDownload ? "1" : "0"
              }&navpanes=0`}
              className="h-screen w-full border-0"
              title={filename}
              onLoad={() => setLoading(false)}
              style={{
                minHeight: "calc(100vh - 60px)",
                overflow: "auto",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
