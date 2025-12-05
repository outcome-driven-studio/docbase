"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  viewerId?: string | null
}

export default function SecurePDFViewer({
  linkId,
  filename,
  allowDownload,
  displayMode = "auto",
  logoUrl,
  pageHeading,
  viewerId,
}: SecurePDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [isSlideshow, setIsSlideshow] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [pageHeight, setPageHeight] = useState<number>(0)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Page tracking state
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now())
  const pageTrackingRef = useRef<{ [key: number]: number }>({}) // Track cumulative time per page

  // Track time spent on current page and send to API
  const trackPageTime = useCallback(
    async (pageNum: number, timeSpent: number) => {
      try {
        await fetch("/api/track-page-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId,
            viewerId,
            sessionId,
            pageNumber: pageNum,
            timeSpentSeconds: Math.round(timeSpent),
          }),
        })
      } catch (error) {
        clientLogger.error("Error tracking page view", { error })
      }
    },
    [linkId, viewerId, sessionId]
  )

  const detectOrientation = useCallback(async () => {
    try {
      const response = await fetch(`/api/view-document/${linkId}`)
      const blob = await response.blob()

      const reader = new FileReader()
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer)
        const pdf = await pdfjs.getDocument(typedArray).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })

        // Use slideshow mode for all documents
        setIsSlideshow(true)
      }
      reader.readAsArrayBuffer(blob)
    } catch (error) {
      clientLogger.error("Error detecting PDF orientation", { error })
      setIsSlideshow(false)
    }
  }, [linkId])

  // Navigation handlers for slideshow
  const goToNextPage = useCallback(() => {
    // Track time spent on current page before moving
    const timeSpent = (Date.now() - pageStartTime) / 1000 // Convert to seconds
    pageTrackingRef.current[currentPage] =
      (pageTrackingRef.current[currentPage] || 0) + timeSpent
    trackPageTime(currentPage, pageTrackingRef.current[currentPage])

    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      setPageStartTime(Date.now())
    }
  }, [currentPage, totalPages, pageStartTime, trackPageTime])

  const goToPrevPage = useCallback(() => {
    // Track time spent on current page before moving
    const timeSpent = (Date.now() - pageStartTime) / 1000 // Convert to seconds
    pageTrackingRef.current[currentPage] =
      (pageTrackingRef.current[currentPage] || 0) + timeSpent
    trackPageTime(currentPage, pageTrackingRef.current[currentPage])

    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setPageStartTime(Date.now())
    }
  }, [currentPage, pageStartTime, trackPageTime])

  useEffect(() => {
    // Fetch PDF URL
    setPdfUrl(`/api/view-document/${linkId}`)

    // Auto-detect orientation if displayMode is "auto"
    if (displayMode === "auto") {
      detectOrientation()
    } else if (displayMode === "slideshow") {
      setIsSlideshow(true)
    }
  }, [displayMode, linkId, detectOrientation])

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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setTotalPages(numPages)
    setLoading(false)
  }

  // Track page time on component unmount or page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = (Date.now() - pageStartTime) / 1000
      pageTrackingRef.current[currentPage] =
        (pageTrackingRef.current[currentPage] || 0) + timeSpent
      trackPageTime(currentPage, pageTrackingRef.current[currentPage])
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      handleBeforeUnload()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [currentPage, pageStartTime, trackPageTime])

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
  }, [isSlideshow, goToNextPage, goToPrevPage])

  // Make PDF links open in new tab
  useEffect(() => {
    if (!isSlideshow) return

    const handleLinkClicks = () => {
      // Find all links in the annotation layer
      const annotationLayer = containerRef.current?.querySelector(
        ".react-pdf__Page__annotations"
      )
      if (!annotationLayer) return

      const links = annotationLayer.querySelectorAll("a[href]")
      links.forEach((link) => {
        const anchor = link as HTMLAnchorElement
        // Skip if already processed
        if (anchor.dataset.processed === "true") return

        // Set target to open in new tab
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"
        anchor.dataset.processed = "true"

        // Also prevent default and handle click manually as backup
        const clickHandler = (e: MouseEvent) => {
          if (anchor.href && !anchor.href.startsWith("#")) {
            e.preventDefault()
            e.stopPropagation()
            window.open(anchor.href, "_blank", "noopener,noreferrer")
          }
        }

        anchor.addEventListener("click", clickHandler, true)
      })
    }

    // Use MutationObserver to watch for dynamically added links
    const observer = new MutationObserver(() => {
      handleLinkClicks()
    })

    // Start observing the container for changes
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      })
    }

    // Run immediately and after a short delay to catch initial render
    handleLinkClicks()
    const timeoutId = setTimeout(handleLinkClicks, 200)
    const timeoutId2 = setTimeout(handleLinkClicks, 500)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
    }
  }, [isSlideshow, currentPage, pdfUrl])

  // Handle links in iframe mode (document mode)
  useEffect(() => {
    if (isSlideshow) return

    const handleIframeLoad = () => {
      // Try to access iframe content (may fail due to CORS/security)
      try {
        const iframe = iframeRef.current
        if (!iframe) return

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document
        if (!iframeDoc) return

        // Find all links in the iframe
        const links = iframeDoc.querySelectorAll("a[href]")
        links.forEach((link) => {
          const anchor = link as HTMLAnchorElement
          if (anchor.dataset.processed === "true") return

          anchor.target = "_blank"
          anchor.rel = "noopener noreferrer"
          anchor.dataset.processed = "true"

          const clickHandler = (e: MouseEvent) => {
            if (anchor.href && !anchor.href.startsWith("#")) {
              e.preventDefault()
              e.stopPropagation()
              window.open(anchor.href, "_blank", "noopener,noreferrer")
            }
          }

          anchor.addEventListener("click", clickHandler, true)
        })
      } catch (error) {
        // Iframe access blocked (expected for PDFs in most browsers)
        // This is a limitation of browser-native PDF viewers
        clientLogger.debug("Cannot access iframe content for link handling", {
          error,
        })
      }
    }

    // Try to process links when iframe loads
    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad)
      // Also try after a delay
      const timeoutId = setTimeout(handleIframeLoad, 1000)
      return () => {
        iframe.removeEventListener("load", handleIframeLoad)
        clearTimeout(timeoutId)
      }
    }
  }, [isSlideshow, linkId])

  return (
    <div className="flex w-full flex-col items-center">
      {/* Controls */}
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center justify-between gap-2 bg-background sm:gap-4">
        {isSlideshow && (
          <div className="flex w-full items-center justify-center gap-3 pt-2 sm:gap-6">
            {/* Center - Browser tab style with logo and filename */}
            {(logoUrl || pageHeading || filename) && (
              <div className="flex max-w-xs items-center gap-2 rounded-t-lg border border-gray-100 bg-gray-100 px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:max-w-md">
                {logoUrl && (
                  <div className="shrink-0">
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={22}
                      height={22}
                      className="size-6 object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                  {pageHeading || filename}
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-800 px-2 py-1 sm:gap-2">
                  <span className="text-xs text-white sm:text-sm">
                    {currentPage} / {totalPages}
                  </span>
                </div>
              </div>
            )}

            {/* Right side - Download button */}
            {allowDownload && (
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-2 sm:gap-2">
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
        className="flex w-full flex-col items-center rounded-lg bg-gray-100 dark:bg-gray-900"
        onContextMenu={disableContextMenu}
        style={{
          overflow: isSlideshow ? "hidden" : "auto",
          maxWidth: "100%",
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
              height: pageHeight
                ? `${pageHeight + 32}px`
                : "calc(100vh - 80px)",
              overflow: "hidden",
              width: "100%",
            }}
          >
            {/* Left Navigation Overlay */}
            <Button
              onClick={goToPrevPage}
              variant="ghost"
              disabled={currentPage === 1}
              className="absolute left-2 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full p-0 text-gray-400 transition-all disabled:opacity-30 sm:left-4 sm:size-16"
            >
              <ChevronLeft className="size-6 sm:size-8" />
            </Button>

            {/* Right Navigation Overlay */}
            <Button
              onClick={goToNextPage}
              variant="ghost"
              disabled={currentPage === totalPages}
              className="absolute right-2 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full p-0 text-gray-400 transition-all disabled:opacity-30 sm:right-4 sm:size-16"
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
                      ? Math.min(
                          containerRef.current.offsetWidth - 16,
                          containerRef.current.offsetHeight * 1.4142
                        )
                      : undefined
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={true}
                  className="max-h-full max-w-full shadow-lg"
                  onLoadSuccess={(page) => {
                    const viewport = page.getViewport({ scale: 1 })
                    const containerWidth =
                      containerRef.current?.offsetWidth || window.innerWidth
                    const scale =
                      Math.min(
                        containerWidth - 16,
                        window.innerHeight * 1.4142
                      ) / viewport.width
                    const scaledHeight = viewport.height * scale
                    setPageHeight(scaledHeight)
                  }}
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
