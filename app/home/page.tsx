import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ArrowRight, FileText, Link2, Eye, Users, FileSignature, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch aggregated analytics
  const { data: analytics } = await supabase.rpc("get_user_home_analytics", {
    user_id_arg: user.id,
  })

  const stats = analytics?.[0] || {
    total_documents: 0,
    total_links: 0,
    total_views: 0,
    total_unique_viewers: 0,
    total_signatures: 0,
    recent_views: [],
    top_documents: [],
  }

  // Fetch timeline data (last 30 days)
  const { data: timeline } = await supabase.rpc("get_user_views_timeline", {
    user_id_arg: user.id,
    days_arg: 30,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back! Here&apos;s an overview of your documents and engagement.
            </p>
          </div>
          <Link href="/docs/new">
            <Button size="lg">
              <FileText className="mr-2 size-5" />
              New Document
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
              <Link href="/docs">
                <p className="text-xs text-muted-foreground hover:text-primary">
                  View all →
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Links</CardTitle>
              <Link2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_links}</div>
              <p className="text-xs text-muted-foreground">
                Shareable links created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views}</div>
              <p className="text-xs text-muted-foreground">
                Across all links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_unique_viewers}</div>
              <Link href="/contacts">
                <p className="text-xs text-muted-foreground hover:text-primary">
                  View contacts →
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signatures</CardTitle>
              <FileSignature className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_signatures}</div>
              <Link href="/signed-documents">
                <p className="text-xs text-muted-foreground hover:text-primary">
                  View signed →
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Top Documents
              </CardTitle>
              <CardDescription>
                Your most viewed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.top_documents && stats.top_documents.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_documents.map((doc: any, index: number) => (
                    <Link key={doc.document_id} href={`/docs/${doc.document_id}`}>
                      <div className="group flex items-center justify-between rounded-lg border p-3 transition-all hover:border-primary hover:bg-accent">
                        <div className="flex items-center space-x-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary">
                              {doc.document_filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="size-3" />
                                {doc.total_views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {doc.unique_viewers} viewers
                              </span>
                              <span className="flex items-center gap-1">
                                <Link2 className="size-3" />
                                {doc.link_count} links
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-3 size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No documents yet. Create your first document to see stats!
                  </p>
                  <Link href="/docs/new">
                    <Button variant="outline" className="mt-4">
                      Create Document
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest document views
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recent_views && stats.recent_views.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_views.slice(0, 10).map((view: any, index: number) => (
                    <Link key={index} href={`/analytics/${view.link_id}`}>
                      <div className="group flex items-start justify-between rounded-lg border p-3 transition-all hover:border-primary hover:bg-accent">
                        <div className="flex-1">
                          <p className="font-medium group-hover:text-primary">
                            {view.document_filename || 'Document'}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="h-5">
                              {view.viewer_email || 'Anonymous'}
                            </Badge>
                            <span>{formatDate(view.viewed_at)}</span>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Eye className="mb-3 size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No views yet. Share your documents to see activity!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Views Timeline Chart */}
        {timeline && timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Views Over Time
              </CardTitle>
              <CardDescription>
                Last 30 days of document views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.slice(0, 10).map((day: any) => {
                  const maxViews = Math.max(...timeline.map((d: any) => d.view_count))
                  const percentage = (day.view_count / maxViews) * 100

                  return (
                    <div key={day.view_date} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{formatDateShort(day.view_date)}</span>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{day.view_count} views</span>
                          <span>{day.unique_viewers} unique</span>
                        </div>
                      </div>
                      <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted">
                        <div
                          className="absolute left-0 top-0 h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/docs">
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-5" />
                  My Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage all documents
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/contacts">
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-5" />
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage your viewer contacts
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/signed-documents">
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="size-5" />
                  Signed Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View signed documents
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/new">
            <Card className="cursor-pointer border-dashed transition-all hover:border-primary hover:bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-5" />
                  Create New
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload and share a document
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
