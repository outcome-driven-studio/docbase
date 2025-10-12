import * as React from "react"

interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
}

export const EmailLayout: React.FC<Readonly<EmailLayoutProps>> = ({
  children,
  previewText,
}) => (
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      {previewText && <meta name="description" content={previewText} />}
    </head>
    <body
      style={{
        backgroundColor: "#f6f9fc",
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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
                    Docbase
                  </h1>
                  <p
                    style={{
                      color: "#a0a0a0",
                      fontSize: "14px",
                      margin: "8px 0 0 0",
                    }}
                  >
                    Secure Document Sharing
                  </p>
                </td>
              </tr>

              {/* Content */}
              <tr>
                <td style={{ padding: "40px" }}>{children}</td>
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
                    <a
                      href={
                        process.env.NEXT_PUBLIC_SITE_URL ||
                        "https://docbase.app"
                      }
                      style={{
                        color: "#1a1a1a",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Docbase
                    </a>
                    <br />
                    Open-source document sharing platform
                  </p>
                </td>
              </tr>
            </table>

            {/* Additional footer text */}
            <table
              style={{ maxWidth: "600px", width: "100%", marginTop: "20px" }}
              role="presentation"
            >
              <tr>
                <td>
                  <p
                    style={{
                      color: "#8898aa",
                      fontSize: "12px",
                      lineHeight: "16px",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    If you didn't request this email, you can safely ignore it.
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

interface ButtonProps {
  href: string
  children: React.ReactNode
}

export const EmailButton: React.FC<Readonly<ButtonProps>> = ({
  href,
  children,
}) => (
  <table role="presentation" style={{ margin: "32px 0" }}>
    <tr>
      <td align="center">
        <a
          href={href}
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
          {children}
        </a>
      </td>
    </tr>
  </table>
)
