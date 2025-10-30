import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      logger.error("Slack OAuth error", { error })
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("Slack authorization failed")}`,
          request.url
        )
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("No authorization code received")}`,
          request.url
        )
      )
    }

    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const redirectUri = `${appUrl}/api/slack/oauth`

    if (!clientId || !clientSecret) {
      logger.error("Slack credentials not configured")
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("Slack integration not configured")}`,
          request.url
        )
      )
    }

    const tokenResponse = await fetch(
      "https://slack.com/api/oauth.v2.access",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      logger.error("Slack token exchange failed", { error: tokenData.error })
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("Failed to connect to Slack")}`,
          request.url
        )
      )
    }

    // Get authenticated user
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("Not authenticated")}`,
          request.url
        )
      )
    }

    // Log the team info for debugging
    logger.info("Slack OAuth response", {
      teamId: tokenData.team?.id,
      teamName: tokenData.team?.name,
      botUserId: tokenData.bot_user_id,
      hasAccessToken: !!tokenData.access_token,
    })

    // Check if domain already exists for this user
    const { data: existingDomain } = await supabase
      .from("domains")
      .select("id, domain_name")
      .eq("user_id", user.id)
      .single()

    // Update or create domain with Slack credentials
    // Note: We're using OAuth with chat:write scope, not incoming webhooks
    // Channel selection happens after connection via the UI
    let updateError
    if (existingDomain) {
      // Update existing domain
      const { error } = await supabase
        .from("domains")
        .update({
          slack_access_token: tokenData.access_token,
          slack_channel_id: null, // Will be set when user selects a channel
          slack_channel_name: null,
          slack_team_id: tokenData.team?.id || null,
          slack_team_name: tokenData.team?.name || null,
        })
        .eq("user_id", user.id)
      updateError = error
    } else {
      // Create new domain with a default domain name
      const { error } = await supabase
        .from("domains")
        .insert({
          user_id: user.id,
          domain_name: "default", // Required field
          slack_access_token: tokenData.access_token,
          slack_channel_id: null,
          slack_channel_name: null,
          slack_team_id: tokenData.team?.id || null,
          slack_team_name: tokenData.team?.name || null,
        })
      updateError = error
    }

    if (updateError) {
      logger.error("Failed to save Slack credentials", { error: updateError })
      return NextResponse.redirect(
        new URL(
          `/account?error=${encodeURIComponent("Failed to save Slack connection")}`,
          request.url
        )
      )
    }

    const teamName = tokenData.team?.name || "workspace"
    logger.info("Slack integration successful", {
      userId: user.id,
      teamId: tokenData.team?.id,
      teamName,
    })

    return NextResponse.redirect(
      new URL(
        `/account?success=${encodeURIComponent(`Connected to ${teamName} successfully!`)}`,
        request.url
      )
    )
  } catch (error) {
    logger.error("Unexpected error in Slack OAuth", { error })
    return NextResponse.redirect(
      new URL(
        `/account?error=${encodeURIComponent("An unexpected error occurred")}`,
        request.url
      )
    )
  }
}
