import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { validate as isUuid } from "uuid"
import { z } from "zod"

import { logger } from "@/lib/logger"

const sendViewLinkSchema = z.object({
  email: z.string().email(),
  linkId: z.string().uuid(),
})

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://build-placeholder.supabase.co"
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "build-placeholder"
const resendApiKey = process.env.RESEND_API_KEY || "build-placeholder"

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

// Access auth admin API
const adminAuthClient = supabase.auth.admin
const resend = new Resend(resendApiKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = sendViewLinkSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, linkId } = validationResult.data

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      logger.error("NEXT_PUBLIC_SITE_URL is not defined")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const redirectTo = `${siteUrl}/links/view/${linkId}`

    const { data, error } = await adminAuthClient.generateLink({
      email,
      type: "magiclink",
      options: {
        redirectTo: redirectTo,
      },
    })

    if (error) {
      logger.error("Supabase error", { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || !data.properties || !data.properties.action_link) {
      logger.error("No action link generated")
      return NextResponse.json(
        { error: "Failed to generate link" },
        { status: 500 }
      )
    }

    const tokenHash = data.properties.hashed_token
    const constructedLink = `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=${encodeURIComponent(
      redirectTo
    )}`

    // Extract domain from site URL for from address
    const domain = new URL(siteUrl).hostname

    // Send the email with Resend using beautiful template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      </head>
      <body style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif; margin: 0; padding: 0;">
        <table style="background-color: #f6f9fc; width: 100%; padding: 40px 0;" role="presentation">
          <tr>
            <td align="center">
              <table style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);" role="presentation">
                <tr>
                  <td style="background-color: #1a1a1a; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0; letter-spacing: -0.5px;">Docbase</h1>
                    <p style="color: #a0a0a0; font-size: 14px; margin: 8px 0 0 0;">Secure Document Sharing</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 32px; margin: 0 0 16px 0;">
                      A Document Has Been Shared With You
                    </h2>
                    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                      Click the button below to securely access the document.
                    </p>
                    <table role="presentation" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${constructedLink}" style="background-color: #1a1a1a; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; line-height: 24px; padding: 14px 32px; text-decoration: none; text-align: center;">
                            View Document
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                      This secure link will expire after use to protect your privacy.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e9ecef;">
                    <p style="color: #6c757d; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      This email was sent from <strong style="color: #1a1a1a;">Docbase</strong><br>
                      Open-source document sharing platform
                    </p>
                  </td>
                </tr>
              </table>
              <table style="max-width: 600px; width: 100%; margin-top: 20px;" role="presentation">
                <tr>
                  <td>
                    <p style="color: #8898aa; font-size: 12px; line-height: 16px; text-align: center; margin: 0;">
                      If you didn't expect this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Docbase <noreply@${domain}>`,
      to: email,
      subject: "View Your Shared Document",
      html: emailHtml,
    })

    if (emailError) {
      logger.error("Resend error", { error: emailError })
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "View link sent successfully" })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
