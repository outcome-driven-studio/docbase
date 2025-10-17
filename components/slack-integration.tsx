"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "./icons"
import { clientLogger } from "@/lib/client-logger"

type User = Database["public"]["Tables"]["users"]["Row"]
type Domain = Database["public"]["Tables"]["domains"]["Row"]

interface SlackChannel {
  id: string
  name: string
  is_private: boolean
}

export default function SlackIntegrationTab({
  account,
  domain,
}: {
  account: User | null
  domain: Domain | null
}) {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>(
    undefined
  )
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const [isSavingChannel, setIsSavingChannel] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    // Check if Slack is connected
    if (domain?.slack_access_token) {
      setIsConnected(true)
      setSelectedChannel(domain.slack_channel_id || undefined)
      setTeamName(domain.slack_team_name || null)

      // Load channels
      loadChannels()
    }

    // Check for success/error messages from OAuth redirect
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success) {
      toast({
        title: "Success!",
        description: success,
      })
    }

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain])

  async function loadChannels() {
    setIsLoadingChannels(true)
    try {
      const response = await fetch("/api/slack/channels")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setChannels(data.channels)
    } catch (error) {
      clientLogger.error("Failed to load Slack channels", { error })
      toast({
        title: "Error",
        description: "Failed to load Slack channels",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChannels(false)
    }
  }

  async function handleChannelChange(channelId: string) {
    setSelectedChannel(channelId)
    setIsSavingChannel(true)

    try {
      const channel = channels.find((ch) => ch.id === channelId)
      if (!channel) {
        throw new Error("Channel not found")
      }

      const response = await fetch("/api/slack/update-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: "Success!",
        description: `Notifications will be sent to #${channel.name}`,
      })
    } catch (error) {
      clientLogger.error("Failed to update Slack channel", { error })
      toast({
        title: "Error",
        description: "Failed to update Slack channel",
        variant: "destructive",
      })
    } finally {
      setIsSavingChannel(false)
    }
  }

  function handleConnectSlack() {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`
    const scopes = [
      "chat:write",
      "channels:read",
      "groups:read",
      "incoming-webhook",
    ].join(",")

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`

    window.location.href = slackAuthUrl
  }

  async function handleDisconnect() {
    try {
      // Clear Slack credentials from domain
      const { error } = await supabase
        .from("domains")
        .update({
          slack_access_token: null,
          slack_channel_id: null,
          slack_channel_name: null,
          slack_team_id: null,
          slack_team_name: null,
        })
        .eq("user_id", account?.id)

      if (error) throw error

      setIsConnected(false)
      setSelectedChannel(undefined)
      setChannels([])
      setTeamName(null)

      toast({
        title: "Disconnected",
        description: "Slack has been disconnected from your account",
      })
    } catch (error) {
      clientLogger.error("Failed to disconnect Slack", { error })
      toast({
        title: "Error",
        description: "Failed to disconnect Slack",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slack Integration</CardTitle>
        <CardDescription>
          Get notifications in Slack when someone views or signs your documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Slack workspace to receive real-time notifications
              when:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Someone opens your document</li>
              <li>Someone signs your document</li>
            </ul>
            <Button onClick={handleConnectSlack} className="w-full">
              <svg
                className="mr-2 size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              Connect to Slack
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Connected to Slack
                  </p>
                  {teamName && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Workspace: {teamName}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Channel</label>
              <Select
                value={selectedChannel}
                onValueChange={handleChannelChange}
                disabled={isLoadingChannels || isSavingChannel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingChannels ? (
                    <div className="flex items-center justify-center py-2">
                      <Icons.spinner className="size-4 animate-spin" />
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                        {channel.is_private && " (private)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the channel where you want to receive notifications
              </p>
            </div>

            {selectedChannel && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Notifications for document views and signatures will be sent to{" "}
                  <strong>
                    #{channels.find((ch) => ch.id === selectedChannel)?.name}
                  </strong>
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
