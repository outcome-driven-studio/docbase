import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      linkId,
      viewerId,
      sessionId,
      pageNumber,
      timeSpentSeconds,
    } = body

    // Validate required fields
    if (!linkId || !sessionId || pageNumber === undefined || timeSpentSeconds === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get the current document version for this link
    const { data: versionData, error: versionError } = await supabase
      .rpc("get_link_document_version", { link_id_arg: linkId })

    if (versionError) {
      logger.error("Error fetching document version", { error: versionError, linkId })
    }

    const documentVersion = versionData || 1

    // Get user agent and IP from headers
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "Unknown"

    // Insert page view record with version
    const { data, error } = await supabase
      .from("page_views")
      .insert({
        link_id: linkId,
        viewer_id: viewerId || null,
        session_id: sessionId,
        page_number: pageNumber,
        time_spent_seconds: Math.round(timeSpentSeconds), // Round to nearest second
        document_version: documentVersion,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single()

    if (error) {
      logger.error("Error tracking page view", { error, body })
      return NextResponse.json(
        { error: "Failed to track page view" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.error("Error in track-page-view API", { error })
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
