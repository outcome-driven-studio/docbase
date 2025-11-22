"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Users, Clock, FileText } from "lucide-react"

type ViewerSession = {
  viewer_id: string | null
  viewer_email: string | null
  session_id: string
  document_version: number
  page_number: number
  time_spent_seconds: number
  viewed_at: string
  total_session_time: number
}

export function ViewerSessionAnalytics({ data }: { data: ViewerSession[] }) {
  // Get unique versions
  const versions = Array.from(new Set(data.map(d => d.document_version))).sort((a, b) => b - a)
  const [selectedVersion, setSelectedVersion] = useState<string>(
    versions.length > 0 ? String(versions[0]) : "all"
  )

  // Filter by version
  const filteredData = selectedVersion === "all"
    ? data
    : data.filter(d => d.document_version === parseInt(selectedVersion))

  // Group by viewer and session
  const groupedData = filteredData.reduce((acc, item) => {
    const viewerKey = item.viewer_email || item.viewer_id || "Anonymous"
    if (!acc[viewerKey]) {
      acc[viewerKey] = {}
    }
    if (!acc[viewerKey][item.session_id]) {
      acc[viewerKey][item.session_id] = {
        version: item.document_version,
        totalTime: item.total_session_time,
        pages: [],
        viewedAt: item.viewed_at,
      }
    }
    acc[viewerKey][item.session_id].pages.push({
      pageNumber: item.page_number,
      timeSpent: item.time_spent_seconds,
    })
    return acc
  }, {} as Record<string, Record<string, {
    version: number
    totalTime: number
    pages: Array<{ pageNumber: number; timeSpent: number }>
    viewedAt: string
  }>>)

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Viewer Session History
          </CardTitle>
          <CardDescription>
            No viewer session data available yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Viewer Session History
            </CardTitle>
            <CardDescription>
              Detailed breakdown of each viewer&apos;s time spent per page
            </CardDescription>
          </div>
          {versions.length > 1 && (
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
                {versions.map((version) => (
                  <SelectItem key={version} value={String(version)}>
                    Version {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedData).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No sessions found for this version
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedData).map(([viewer, sessions]) => (
              <AccordionItem key={viewer} value={viewer}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span className="font-medium">{viewer}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(sessions).length} session{Object.keys(sessions).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pl-6">
                    {Object.entries(sessions)
                      .sort(([, a], [, b]) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
                      .map(([sessionId, sessionData]) => (
                        <div
                          key={sessionId}
                          className="rounded-lg border bg-muted/30 p-4 space-y-3"
                        >
                          {/* Session Header */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="size-4" />
                                <span className="font-medium">
                                  Total Time: {formatTime(sessionData.totalTime)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(sessionData.viewedAt)}
                              </div>
                            </div>
                            {versions.length > 1 && (
                              <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
                                Version {sessionData.version}
                              </div>
                            )}
                          </div>

                          {/* Pages visited */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <FileText className="size-3" />
                              Pages Visited ({sessionData.pages.length})
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                              {sessionData.pages
                                .sort((a, b) => a.pageNumber - b.pageNumber)
                                .map((page, idx) => (
                                  <div
                                    key={`${sessionId}-${page.pageNumber}-${idx}`}
                                    className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
                                  >
                                    <span className="font-medium">Page {page.pageNumber}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(page.timeSpent)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
