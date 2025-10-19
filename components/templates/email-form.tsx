import * as React from "react"

import { Database } from "@/types/supabase"

type Fund = Database["public"]["Tables"]["funds"]["Row"]
type Investor = Database["public"]["Tables"]["users"]["Row"]

interface EmailTemplateProps {
  name: string
  url: string
  investor: Investor
  fund: Fund
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  url,
  investor,
  fund,
}) => (
  <html>
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
        style={{ backgroundColor: "#f6f9fc", width: "100%", padding: "40px 0" }}
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
              {/* Header */}
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

              {/* Content */}
              <tr>
                <td style={{ padding: "40px" }}>
                  <p
                    style={{
                      color: "#1a1a1a",
                      fontSize: "18px",
                      fontWeight: "500",
                      margin: "0 0 16px 0",
                    }}
                  >
                    Hi {name.split(" ")[0]},
                  </p>

                  <p
                    style={{
                      color: "#525252",
                      fontSize: "16px",
                      lineHeight: "24px",
                      margin: "0 0 24px 0",
                    }}
                  >
                    {investor.name && investor.name.split(" ")[0]} from{" "}
                    <strong>{fund.name}</strong> wants to make an investment in
                    your company.
                  </p>

                  <table role="presentation" style={{ margin: "32px 0" }}>
                    <tr>
                      <td align="center">
                        <a
                          href={url}
                          style={{
                            backgroundColor: "#1a1a1a",
                            borderRadius: "6px",
                            color: "#ffffff",
                            display: "inline-block",
                            fontSize: "16px",
                            fontWeight: "600",
                            lineHeight: "24px",
                            padding: "14px 32px",
                            textDecoration: "none",
                            textAlign: "center",
                          }}
                        >
                          Enter Information for SAFE Agreement
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "20px",
                      borderRadius: "6px",
                      marginTop: "24px",
                    }}
                  >
                    <p
                      style={{
                        color: "#737373",
                        fontSize: "14px",
                        lineHeight: "20px",
                        margin: 0,
                      }}
                    >
                      <strong>Privacy Note:</strong> Your information will only
                      be shared with {investor.name} from {fund.name} for
                      drafting the SAFE Agreement. They will get your approval
                      before circulating for e-signing.
                    </p>
                  </div>
                </td>
              </tr>

              {/* Footer */}
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
  </html>
)
