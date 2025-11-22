import Link from "next/link"
import { createClient } from "@/utils/supabase/server"

import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import Analytics from "@/components/analytics"
import { SignatureStatus } from "@/components/signature-status"
import { PageTimeChart } from "@/components/page-time-chart"
import { ViewerSessionAnalytics } from "@/components/viewer-session-analytics"

type ViewerData = {
  id: string
  email: string
  viewed_at: string
}

export default async function AnalyticsPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const supabase = createClient()

  // Fetch link analytics
  const { data, error } = await supabase.rpc("get_link_analytics", {
    link_id_arg: id,
  })

  if (error) {
    logger.error("Error fetching analytics", { error })
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Error fetching analytics
        </h1>
        <Link href="/docs">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
    )
  }

  // Fetch link data to check if signatures are required
  const { data: linkData, error: linkError } = await supabase.rpc("select_link", {
    link_id: id,
  })

  const requireSignature = linkData?.[0]?.require_signature ?? false
  const internalName = linkData?.[0]?.name
  const filename = linkData?.[0]?.filename

  const allViewers = data?.[0]?.all_viewers ?? 0
  const uniqueViewers = data?.[0]?.unique_viewers ?? 0
  const allViews = (data?.[0]?.all_views ?? []) as ViewerData[]

  // Fetch page-level analytics with version support
  const { data: pageAnalytics } = await supabase.rpc("get_link_page_analytics_by_version", {
    link_id_arg: id,
    version_arg: null, // null returns all versions
  })

  // Fetch viewer session analytics
  const { data: sessionAnalytics } = await supabase.rpc("get_viewer_session_analytics", {
    link_id_arg: id,
    version_arg: null, // null returns all versions
  })

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">
          {requireSignature ? "Analytics & Signatures" : "Link Analytics"}
        </h1>
        {internalName && (
          <p className="mt-2 text-lg text-muted-foreground">
            {internalName}
          </p>
        )}
        {filename && (
          <p className="text-sm text-muted-foreground">
            {filename}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Signature Status - only show if signatures are required */}
        {requireSignature && <SignatureStatus linkId={id} />}

        {/* Page Time Analytics */}
        <PageTimeChart data={pageAnalytics || []} />

        {/* Viewer Session History */}
        <ViewerSessionAnalytics data={sessionAnalytics || []} />

        {/* View Analytics */}
        <Analytics
          allViewers={allViewers}
          uniqueViewers={uniqueViewers}
          allViews={allViews}
        />
      </div>
    </div>
  )
}
