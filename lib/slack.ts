import { logger } from "@/lib/logger"

interface SlackNotificationOptions {
  accessToken: string
  channelId: string
  text: string
  blocks?: any[]
}

/**
 * Sends a notification to a Slack channel
 */
export async function sendSlackNotification({
  accessToken,
  channelId,
  text,
  blocks,
}: SlackNotificationOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text,
        blocks,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      logger.error("Slack API error", { error: data.error })
      return { success: false, error: data.error }
    }

    logger.info("Slack notification sent successfully", { channelId })
    return { success: true }
  } catch (error) {
    logger.error("Failed to send Slack notification", { error })
    return { success: false, error: String(error) }
  }
}

/**
 * Creates a formatted Slack message for document view notification
 */
export function createDocumentViewMessage(
  documentName: string,
  viewerEmail: string,
  documentLink?: string
) {
  const text = `📄 Someone opened your document: ${documentName}`

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📄 Document Opened*\n\nSomeone just viewed your document!`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Document:*\n${documentName}`,
        },
        {
          type: "mrkdwn",
          text: `*Viewer:*\n${viewerEmail}`,
        },
        {
          type: "mrkdwn",
          text: `*Time:*\n${new Date().toLocaleString()}`,
        },
      ],
    },
  ]

  if (documentLink) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Document",
          },
          url: documentLink,
          style: "primary",
        },
      ],
    })
  }

  return { text, blocks }
}

/**
 * Creates a formatted Slack message for signature notification
 */
export function createSignatureMessage(
  documentName: string,
  signerName: string,
  signerEmail: string,
  documentLink?: string
) {
  const text = `✍️ ${signerName} signed your document: ${documentName}`

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*✍️ Document Signed*\n\nSomeone just signed your document!`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Document:*\n${documentName}`,
        },
        {
          type: "mrkdwn",
          text: `*Signer:*\n${signerName}`,
        },
        {
          type: "mrkdwn",
          text: `*Email:*\n${signerEmail}`,
        },
        {
          type: "mrkdwn",
          text: `*Time:*\n${new Date().toLocaleString()}`,
        },
      ],
    },
  ]

  if (documentLink) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Document",
          },
          url: documentLink,
          style: "primary",
        },
      ],
    })
  }

  return { text, blocks }
}
