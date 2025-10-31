"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock } from "lucide-react"

type PageTimeData = {
  page_number: number
  total_views: number
  total_time_seconds: number
  avg_time_seconds: number
  unique_viewers: number
}

export function PageTimeChart({ data }: { data: PageTimeData[] }) {
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

  const maxTime = Math.max(...data.map(d => d.avg_time_seconds))
  
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
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Page Analytics
        </CardTitle>
        <CardDescription>
          Average time spent on each page across all viewers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-xs text-muted-foreground">Pages</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + Number(d.total_views), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Views</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {formatTime(
                  data.reduce((sum, d) => sum + Number(d.total_time_seconds), 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-2xl font-bold">
                {formatTime(
                  data.reduce((sum, d) => sum + Number(d.avg_time_seconds), 0) / data.length
                )}
              </div>
              <div className="text-xs text-muted-foreground">Avg Per Page</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-2">
            {data.map((page) => {
              const percentage = (page.avg_time_seconds / maxTime) * 100
              
              return (
                <div key={page.page_number} className="space-y-1">
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
            })}
          </div>

          {/* Insights */}
          {data.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-semibold">Insights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • Most engaged: Page {data.reduce((max, page) => 
                    page.avg_time_seconds > max.avg_time_seconds ? page : max
                  ).page_number} ({formatTime(Math.max(...data.map(d => d.avg_time_seconds)))})
                </li>
                <li>
                  • Least engaged: Page {data.reduce((min, page) => 
                    page.avg_time_seconds < min.avg_time_seconds ? page : min
                  ).page_number} ({formatTime(Math.min(...data.map(d => d.avg_time_seconds)))})
                </li>
                <li>
                  • {data.reduce((sum, d) => sum + Number(d.unique_viewers), 0)} unique viewers tracked
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
