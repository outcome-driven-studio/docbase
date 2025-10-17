import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceRoleClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"
import {
  sendSlackNotification,
  createDocumentViewMessage,
} from "@/lib/slack"

const captureViewerSchema = z.object({
  linkId: z.string().uuid(),
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    console.log("[capture-viewer] Starting request")
    const body = await req.json()
    console.log("[capture-viewer] Body received:", body)

    // Validate input
    const validationResult = captureViewerSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("[capture-viewer] Validation failed:", validationResult.error.errors)
      logger.error("Validation failed for capture-viewer", {
        errors: validationResult.error.errors,
        receivedData: body,
      })
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { linkId, email } = validationResult.data
    console.log("[capture-viewer] Validated data:", { linkId, email })

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[capture-viewer] SUPABASE_SERVICE_ROLE_KEY is not set!")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    console.log("[capture-viewer] Service role key exists:", process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "...")

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()
    console.log("[capture-viewer] Service role client created")

    // Verify link exists and get link details with creator info
    console.log("[capture-viewer] Querying link:", linkId)
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, require_email, name, filename, created_by")
      .eq("id", linkId)
      .single()

    console.log("[capture-viewer] Link query result:", { link, linkError })

    if (linkError || !link) {
      console.error("[capture-viewer] Link not found:", { linkId, error: linkError })
      logger.error("Link not found", { linkId, error: linkError })
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Insert viewer record (using service role, bypasses RLS)
    console.log("[capture-viewer] Inserting viewer record")
    const { error: viewerError } = await supabase.from("viewers").insert({
      link_id: linkId,
      email: email,
      viewed_at: new Date().toISOString(),
    })

    console.log("[capture-viewer] Viewer insert result:", { viewerError })

    if (viewerError) {
      console.error("[capture-viewer] Error inserting viewer:", viewerError)
      logger.error("Error inserting viewer record", {
        linkId,
        email,
        error: viewerError,
      })
      return NextResponse.json(
        { error: "Failed to capture viewer email", details: viewerError.message },
        { status: 500 }
      )
    }

    console.log("[capture-viewer] Success!")
    logger.info("Viewer email captured", { linkId, email })

    // Send Slack notification if configured (don't fail if Slack notification fails)
    try {
      if (link.created_by) {
        const { data: domain } = await supabase
          .from("domains")
          .select("slack_access_token, slack_channel_id")
          .eq("user_id", link.created_by)
          .single()

        if (
          domain?.slack_access_token &&
          domain?.slack_channel_id
        ) {
          const documentName = link.name || link.filename || "Document"
          const { text, blocks } = createDocumentViewMessage(
            documentName,
            email
          )

          await sendSlackNotification({
            accessToken: domain.slack_access_token,
            channelId: domain.slack_channel_id,
            text,
            blocks,
          })

          logger.info("Slack notification sent for document view", {
            linkId,
            viewerEmail: email,
          })
        }
      }
    } catch (slackError) {
      // Log but don't fail the request if Slack notification fails
      logger.error("Failed to send Slack notification for document view", {
        error: slackError,
        linkId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[capture-viewer] Caught error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error in capture-viewer route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}
