import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { sendSlackNotification, createDocumentViewMessage } from "@/lib/slack"

/**
 * Test endpoint to verify Slack integration is working
 * GET /api/test-slack
 */
export async function GET() {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get user's domain with Slack config
    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .select("slack_access_token, slack_channel_id, slack_channel_name, slack_team_name")
      .eq("user_id", user.id)
      .single()

    if (domainError) {
      return NextResponse.json({
        error: "Failed to get domain",
        details: domainError,
        debug: {
          userId: user.id,
          userEmail: user.email,
        }
      }, { status: 500 })
    }

    // Check configuration
    const hasToken = !!domain?.slack_access_token
    const hasChannel = !!domain?.slack_channel_id

    if (!hasToken) {
      return NextResponse.json({
        error: "Slack not connected",
        message: "Go to Account → Slack Integration → Connect to Slack",
        debug: {
          userId: user.id,
          userEmail: user.email,
          hasToken: false,
          hasChannel: false,
        }
      }, { status: 400 })
    }

    if (!hasChannel) {
      return NextResponse.json({
        error: "Slack channel not selected",
        message: "Go to Account → Slack Integration → Select a channel",
        debug: {
          userId: user.id,
          userEmail: user.email,
          hasToken: true,
          hasChannel: false,
          teamName: domain.slack_team_name,
        }
      }, { status: 400 })
    }

    // Try to send test message
    const { text, blocks } = createDocumentViewMessage(
      "Test Document",
      "test@example.com"
    )

    const result = await sendSlackNotification({
      accessToken: domain.slack_access_token,
      channelId: domain.slack_channel_id,
      text: "🧪 Test notification from DocBase",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*🧪 Test Notification*\n\nIf you can see this, your Slack integration is working correctly!"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `User: ${user.email} | Channel: #${domain.slack_channel_name} | Workspace: ${domain.slack_team_name || 'Unknown'}`
            }
          ]
        }
      ]
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test notification sent successfully! Check your Slack channel.",
        debug: {
          userId: user.id,
          userEmail: user.email,
          channelId: domain.slack_channel_id,
          channelName: domain.slack_channel_name,
          teamName: domain.slack_team_name,
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to send Slack notification",
        slackError: result.error,
        debug: {
          userId: user.id,
          userEmail: user.email,
          channelId: domain.slack_channel_id,
          channelName: domain.slack_channel_name,
          tokenPrefix: domain.slack_access_token?.substring(0, 10),
        }
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[test-slack] Error:", error)
    return NextResponse.json({
      error: "Unexpected error",
      details: String(error)
    }, { status: 500 })
  }
}
