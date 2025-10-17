import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user's Slack access token
    const { data: domain } = await supabase
      .from("domains")
      .select("slack_access_token")
      .eq("user_id", user.id)
      .single()

    if (!domain || !domain.slack_access_token) {
      return NextResponse.json(
        { error: "Slack not connected" },
        { status: 404 }
      )
    }

    // Fetch channels from Slack
    const response = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true",
      {
        headers: {
          Authorization: `Bearer ${domain.slack_access_token}`,
        },
      }
    )

    const data = await response.json()

    if (!data.ok) {
      logger.error("Failed to fetch Slack channels", { error: data.error })
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 }
      )
    }

    // Return channels with id and name
    const channels = data.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private,
    }))

    return NextResponse.json({ channels })
  } catch (error) {
    logger.error("Unexpected error fetching Slack channels", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    )
  }
}
