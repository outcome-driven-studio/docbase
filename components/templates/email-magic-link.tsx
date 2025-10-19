import * as React from "react"

import { EmailButton, EmailLayout } from "./email-layout"

interface MagicLinkEmailProps {
  magicLink: string
  documentName?: string
}

export const MagicLinkEmail: React.FC<Readonly<MagicLinkEmailProps>> = ({
  magicLink,
  documentName,
}) => (
  <EmailLayout
    previewText={
      documentName ? `Access ${documentName}` : "Access your document"
    }
  >
    <h2
      style={{
        color: "#1a1a1a",
        fontSize: "24px",
        fontWeight: "600",
        lineHeight: "32px",
        margin: "0 0 16px 0",
      }}
    >
      {documentName ? `Access ${documentName}` : "Access Your Document"}
    </h2>

    <p
      style={{
        color: "#525252",
        fontSize: "16px",
        lineHeight: "24px",
        margin: "0 0 24px 0",
      }}
    >
      A document has been shared with you securely via VibeDocs. Click the button
      below to view it.
    </p>

    <EmailButton href={magicLink}>View Document</EmailButton>

    <p
      style={{
        color: "#737373",
        fontSize: "14px",
        lineHeight: "20px",
        margin: "24px 0 0 0",
      }}
    >
      This link will expire after use for your security.
    </p>
  </EmailLayout>
)
