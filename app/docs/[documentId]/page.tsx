import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { ArrowLeft, FileText, Plus, Eye, Calendar, Lock, Mail, FileSignature, Download, MoreVertical, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyLinkButton } from "@/components/copy-link-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const dynamic = "force-dynamic"

export default async function DocumentPage({ params }: { params: { documentId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get document with its links
  const { data: documents } = await supabase.rpc("get_document_with_links", {
    document_id_arg: params.documentId,
    user_id_arg: user.id,
  })

  const document = documents?.[0]

  if (!document) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Document not found
        </h1>
        <Link href="/docs">
          <Button variant="outline">Back to Docs</Button>
        </Link>
      </div>
    )
  }

  const links = Array.isArray(document.links) ? document.links : []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const getTotalViews = () => {
    return links.reduce((sum: number, link: any) => sum + (link.view_count || 0), 0)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Docs
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="size-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{document.document_filename}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="mr-1 size-4" />
                    Created {formatDate(document.document_created_at)}
                  </span>
                  <span>{formatFileSize(document.document_file_size)}</span>
                  <span className="flex items-center">
                    <Eye className="mr-1 size-4" />
                    {getTotalViews()} total views
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/docs/new-from-document/${document.document_id}`}>
              <Button>
                <Plus className="mr-2 size-4" />
                Create Link
              </Button>
            </Link>
          </div>
        </div>

        {/* Links Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Shareable Links ({links.length})
            </h2>
          </div>

          {links.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No links created yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Create your first shareable link for this document
                </p>
                <Link href={`/docs/new-from-document/${document.document_id}`}>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create First Link
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {links.map((link: any, index: number) => (
                <Card key={link.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/docs/edit/${link.id}`}>
                          <CardTitle className="cursor-pointer hover:text-primary">
                            {link.viewer_page_heading || `Link ${index + 1}`}
                          </CardTitle>
                        </Link>
                        {link.viewer_page_subheading && (
                          <CardDescription className="mt-1">
                            {link.viewer_page_subheading}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/analytics/${link.id}`}>
                              <BarChart3 className="mr-2 size-4" />
                              View Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/docs/edit/${link.id}`}>
                              Edit Link
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/docs/edit/${link.id}?clone=true`}>
                              Clone Link
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Link URL */}
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 rounded bg-muted px-3 py-2 text-xs">
                        {process.env.NEXT_PUBLIC_SITE_URL}/links/view/{link.id}
                      </code>
                      <CopyLinkButton url={`${process.env.NEXT_PUBLIC_SITE_URL}/links/view/${link.id}`} />
                    </div>

                    {/* Link Properties */}
                    <div className="flex flex-wrap items-center gap-2">
                      {link.password && (
                        <Badge variant="secondary">
                          <Lock className="mr-1 size-3" />
                          Password Protected
                        </Badge>
                      )}
                      {link.require_email && (
                        <Badge variant="secondary">
                          <Mail className="mr-1 size-3" />
                          Email Required
                        </Badge>
                      )}
                      {link.require_signature && (
                        <Badge variant="secondary">
                          <FileSignature className="mr-1 size-3" />
                          Signature Required
                        </Badge>
                      )}
                      {link.allow_download && (
                        <Badge variant="secondary">
                          <Download className="mr-1 size-3" />
                          Download Enabled
                        </Badge>
                      )}
                      {link.expires && (
                        <Badge variant="outline">
                          Expires {formatDate(link.expires)}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Link href={`/analytics/${link.id}`}>
                        <span className="flex cursor-pointer items-center hover:text-primary hover:underline">
                          <Eye className="mr-1 size-4" />
                          {link.view_count || 0} views
                        </span>
                      </Link>
                      <span>Created {formatDate(link.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
