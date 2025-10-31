"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Link as LinkIcon, Eye, Calendar, Lock, Mail, FileSignature, Download, MoreVertical, Copy, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

type LinkData = {
  id: string
  created_at: string
  expires: string | null
  password: string | null
  require_email: boolean
  require_signature: boolean
  allow_download: boolean
  viewer_page_heading: string | null
  viewer_page_subheading: string | null
  view_count: number
}

type DocumentWithLinks = {
  document_id: string
  document_filename: string
  document_storage_path: string
  document_file_size: number | null
  document_mime_type: string | null
  document_display_mode: string | null
  document_created_at: string
  document_updated_at: string
  links: LinkData[]
}

export function DocsCard({ document }: { document: DocumentWithLinks }) {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
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
    return document.links.reduce((sum, link) => sum + link.view_count, 0)
  }

  const handleCopyLink = (linkId: string) => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/links/view/${linkId}`
    navigator.clipboard.writeText(url).then(() => {
      toast({
        description: "Link copied to clipboard",
      })
    })
  }

  const handleDeleteDocument = async () => {
    if (!confirm(`Are you sure you want to delete "${document.document_filename}"? This will delete all associated links and cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      // Delete storage file
      const { error: storageError } = await supabase.storage
        .from("cube")
        .remove([document.document_storage_path])

      if (storageError) {
        console.warn("Failed to delete storage file:", storageError)
      }

      // Delete document (links will cascade delete)
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.document_id)

      if (dbError) throw dbError

      toast({
        description: "Document deleted successfully",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        description: error.message || "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getDefaultLink = () => {
    return document.links[document.links.length - 1] || document.links[0]
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <Link href={`/docs/${document.document_id}`}>
                <CardTitle className="line-clamp-1 cursor-pointer text-lg hover:text-primary">
                  {document.document_filename}
                </CardTitle>
              </Link>
              <CardDescription className="mt-1 flex items-center space-x-4 text-xs">
                <span className="flex items-center">
                  <Calendar className="mr-1 size-3" />
                  {formatDate(document.document_created_at)}
                </span>
                <span>{formatFileSize(document.document_file_size)}</span>
                <span className="flex items-center">
                  <Eye className="mr-1 size-3" />
                  {getTotalViews()} views
                </span>
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/docs/${document.document_id}`}>
                  View & Manage Links
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/docs/new-from-document/${document.document_id}`}>
                  <Plus className="mr-2 size-4" />
                  Create New Link
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="text-destructive"
              >
                {isDeleting ? "Deleting..." : "Delete Document"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Links Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Shareable Links ({document.links.length})
            </h4>
            <Link href={`/docs/new-from-document/${document.document_id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Plus className="mr-1 size-3" />
                Add Link
              </Button>
            </Link>
          </div>

          {document.links.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No links created yet
              </p>
              <Link href={`/docs/new-from-document/${document.document_id}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  Create First Link
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {document.links.slice(0, 3).map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="size-3 text-muted-foreground" />
                      <Link href={`/docs/edit/${link.id}`}>
                        <span className="cursor-pointer text-sm font-medium hover:text-primary">
                          {link.viewer_page_heading || `Link ${document.links.indexOf(link) + 1}`}
                        </span>
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {link.password && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          <Lock className="mr-1 size-2.5" />
                          Password
                        </Badge>
                      )}
                      {link.require_email && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          <Mail className="mr-1 size-2.5" />
                          Email
                        </Badge>
                      )}
                      {link.require_signature && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          <FileSignature className="mr-1 size-2.5" />
                          Signature
                        </Badge>
                      )}
                      {link.allow_download && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          <Download className="mr-1 size-2.5" />
                          Download
                        </Badge>
                      )}
                      {link.expires && (
                        <Badge variant="outline" className="h-5 text-xs">
                          Expires {formatDate(link.expires)}
                        </Badge>
                      )}
                      <Link href={`/analytics/${link.id}`}>
                        <span className="cursor-pointer text-xs text-muted-foreground hover:text-primary hover:underline">
                          · {link.view_count} views
                        </span>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => handleCopyLink(link.id)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="size-8 p-0">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/analytics/${link.id}`}>
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
                </div>
              ))}
              {document.links.length > 3 && (
                <Link href={`/docs/${document.document_id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View all {document.links.length} links
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
