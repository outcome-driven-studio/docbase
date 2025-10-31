import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

const updateChannelSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
})

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updateChannelSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { channelId, channelName } = validationResult.data

    // Get the Slack access token to join the channel
    const { data: domain } = await supabase
      .from("domains")
      .select("slack_access_token")
      .eq("user_id", user.id)
      .single()

    if (!domain?.slack_access_token) {
      return NextResponse.json(
        { error: "Slack not connected" },
        { status: 400 }
      )
    }

    // Try to join the channel automatically using conversations.join
    let needsManualInvite = false
    try {
      const joinResponse = await fetch(
        "https://slack.com/api/conversations.join",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${domain.slack_access_token}`,
          },
          body: JSON.stringify({
            channel: channelId,
          }),
        }
      )

      const joinData = await joinResponse.json()

      // If join fails, log it but don't fail the whole operation
      // (the channel might be private and require manual invite)
      if (!joinData.ok) {
        logger.warn("Could not auto-join channel", {
          channelId,
          channelName,
          error: joinData.error,
          userId: user.id,
        })
        
        // Check if manual invite is needed
        needsManualInvite = 
          joinData.error === "method_not_supported_for_channel_type" ||
          joinData.error === "not_in_channel" ||
          joinData.error === "channel_not_found" ||
          joinData.error === "missing_scope"
      } else {
        logger.info("Bot auto-joined channel", { channelId, userId: user.id })
      }
    } catch (joinError) {
      logger.error("Error joining channel", { error: joinError })
      // Continue anyway - the user can manually invite
      needsManualInvite = true
    }

    // Update the channel in the domains table
    const { error: updateError } = await supabase
      .from("domains")
      .update({
        slack_channel_id: channelId,
        slack_channel_name: channelName,
      })
      .eq("user_id", user.id)

    if (updateError) {
      logger.error("Failed to update Slack channel", { error: updateError })
      return NextResponse.json(
        { error: "Failed to update channel" },
        { status: 500 }
      )
    }

    logger.info("Slack channel updated", { userId: user.id, channelId, needsManualInvite })

    // Return success with info about whether manual invite is needed
    if (needsManualInvite) {
      return NextResponse.json({
        success: true,
        needsInvite: true,
        warning: `Channel selected! To receive notifications, invite the bot to #${channelName} by typing: /invite @DocBase`
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Unexpected error updating Slack channel", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    )
  }
}
