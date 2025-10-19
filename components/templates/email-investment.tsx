import * as React from "react"
import { Html } from "@react-email/html"
import { Text } from "@react-email/text"
import DOMPurify from "isomorphic-dompurify"

interface EmailTemplateProps {
  emailContent: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  emailContent,
}) => {
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target"],
    ALLOW_DATA_ATTR: false,
  }

  const sanitizedHtml = DOMPurify.sanitize(emailContent, sanitizeConfig)

  return (
    <Html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      </head>
      <body
        style={{
          backgroundColor: "#f6f9fc",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <table
          style={{
            backgroundColor: "#f6f9fc",
            width: "100%",
            padding: "40px 0",
          }}
          role="presentation"
        >
          <tr>
            <td align="center">
              <table
                style={{
                  backgroundColor: "#ffffff",
                  maxWidth: "600px",
                  width: "100%",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
                role="presentation"
              >
                <tr>
                  <td
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "32px 40px",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: "600",
                        margin: 0,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      VibeDocs
                    </h1>
                    <p
                      style={{
                        color: "#a0a0a0",
                        fontSize: "14px",
                        margin: "8px 0 0 0",
                      }}
                    >
                      Your vibe, your docs
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "40px" }}>
                    <Text dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "24px 40px",
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <p
                      style={{
                        color: "#6c757d",
                        fontSize: "12px",
                        lineHeight: "18px",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      This email was sent from{" "}
                      <strong style={{ color: "#1a1a1a" }}>VibeDocs</strong>
                      <br />
                      Self-hosted document sharing platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </Html>
  )
}
