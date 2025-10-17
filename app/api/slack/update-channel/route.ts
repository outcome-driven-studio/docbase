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

    logger.info("Slack channel updated", { userId: user.id, channelId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Unexpected error updating Slack channel", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    )
  }
}
