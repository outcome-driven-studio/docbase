import Link from "next/link"
import { createClient } from "@/utils/supabase/server"

import { ViewerData } from "@/types/supabase"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import Analytics from "@/components/analytics"
import { SignatureStatus } from "@/components/signature-status"

export default async function AnalyticsPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const supabase = createClient()

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
        <Link href="/links">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
    )
  }

  const allViewers = data?.[0]?.all_viewers ?? 0
  const uniqueViewers = data?.[0]?.unique_viewers ?? 0
  const allViews = (data?.[0]?.all_views ?? []) as ViewerData[]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Analytics & Signatures
      </h1>

      <div className="space-y-6">
        {/* Signature Status */}
        <SignatureStatus linkId={id} />

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
