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
    // Note: Contact is automatically created via database trigger on viewers table

    // Send Slack notification if configured (don't fail if Slack notification fails)
    try {
      console.log("[capture-viewer] Checking Slack notification...")
      if (link.created_by) {
        console.log("[capture-viewer] Link creator:", link.created_by)
        const { data: domain, error: domainError } = await supabase
          .from("domains")
          .select("slack_access_token, slack_channel_id")
          .eq("user_id", link.created_by)
          .single()

        console.log("[capture-viewer] Domain query result:", {
          hasToken: !!domain?.slack_access_token,
          hasChannel: !!domain?.slack_channel_id,
          channelId: domain?.slack_channel_id,
          domainError
        })

        if (
          domain?.slack_access_token &&
          domain?.slack_channel_id
        ) {
          console.log("[capture-viewer] Sending Slack notification...")
          const documentName = link.name || link.filename || "Document"
          const { text, blocks } = createDocumentViewMessage(
            documentName,
            email
          )

          const result = await sendSlackNotification({
            accessToken: domain.slack_access_token,
            channelId: domain.slack_channel_id,
            text,
            blocks,
          })

          console.log("[capture-viewer] Slack notification result:", result)
          logger.info("Slack notification sent for document view", {
            linkId,
            viewerEmail: email,
            success: result.success,
          })
        } else {
          console.log("[capture-viewer] Slack not configured - skipping notification")
          logger.info("Slack notification skipped - not configured", {
            linkId,
            hasToken: !!domain?.slack_access_token,
            hasChannel: !!domain?.slack_channel_id,
          })
        }
      }
    } catch (slackError) {
      // Log but don't fail the request if Slack notification fails
      console.error("[capture-viewer] Slack notification error:", slackError)
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
