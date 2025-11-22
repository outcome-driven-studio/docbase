"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Clock } from "lucide-react"

type PageTimeData = {
  page_number: number
  total_views: number
  total_time_seconds: number
  avg_time_seconds: number
  unique_viewers: number
  document_version: number
}

export function PageTimeChart({ data }: { data: PageTimeData[] }) {
  // Get unique versions from the data
  const versions = Array.from(new Set(data.map(d => d.document_version))).sort((a, b) => b - a)
  const [selectedVersion, setSelectedVersion] = useState<string>(
    versions.length > 0 ? String(versions[0]) : "all"
  )
  
  // Filter data by selected version
  const filteredData = selectedVersion === "all" 
    ? data 
    : data.filter(d => d.document_version === parseInt(selectedVersion))
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Page Analytics
          </CardTitle>
          <CardDescription>
            No page-level data available yet. Page tracking will appear here once viewers navigate through your document.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const maxTime = filteredData.length > 0 
    ? Math.max(...filteredData.map(d => d.avg_time_seconds))
    : 0
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Page Analytics
            </CardTitle>
            <CardDescription>
              Average time spent on each page across all viewers
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
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {Array.from(new Set(filteredData.map(d => d.page_number))).length}
              </div>
              <div className="text-xs text-muted-foreground">Pages</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {filteredData.reduce((sum, d) => sum + Number(d.total_views), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Views</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {formatTime(
                  filteredData.reduce((sum, d) => sum + Number(d.total_time_seconds), 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {filteredData.length > 0 ? formatTime(
                  filteredData.reduce((sum, d) => sum + Number(d.avg_time_seconds), 0) / filteredData.length
                ) : "0s"}
              </div>
              <div className="text-xs text-muted-foreground">Avg Per Page</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-2">
            {filteredData.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No data available for this version
              </div>
            ) : (
              filteredData
                .sort((a, b) => a.page_number - b.page_number)
                .map((page) => {
                  const percentage = maxTime > 0 ? (page.avg_time_seconds / maxTime) * 100 : 0
                  
                  return (
                    <div key={`${page.page_number}-${page.document_version}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Page {page.page_number}</span>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTime(page.avg_time_seconds)}
                          </span>
                          <span>
                            {page.total_views} views
                          </span>
                        </div>
                      </div>
                      <div className="relative h-8 w-full overflow-hidden rounded-md bg-muted">
                        <div
                          className="absolute left-0 top-0 h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="flex h-full items-center justify-end pr-2 text-xs font-medium text-primary-foreground">
                            {percentage > 20 && formatTime(page.avg_time_seconds)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>

          {/* Insights */}
          {filteredData.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold">Insights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • Most engaged: Page {filteredData.reduce((max, page) => 
                    page.avg_time_seconds > max.avg_time_seconds ? page : max
                  ).page_number} ({formatTime(Math.max(...filteredData.map(d => d.avg_time_seconds)))})
                </li>
                <li>
                  • Least engaged: Page {filteredData.reduce((min, page) => 
                    page.avg_time_seconds < min.avg_time_seconds ? page : min
                  ).page_number} ({formatTime(Math.min(...filteredData.map(d => d.avg_time_seconds)))})
                </li>
                <li>
                  • {Array.from(new Set(filteredData.map(d => d.unique_viewers))).reduce((sum, n) => sum + Number(n), 0)} unique viewers tracked
                </li>
                {versions.length > 1 && selectedVersion !== "all" && (
                  <li>
                    • Viewing data for Version {selectedVersion}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
