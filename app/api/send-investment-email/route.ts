import { Resend } from "resend"

import { logger } from "@/lib/logger"
import { EmailTemplate } from "@/components/templates/email-investment"

const resendApiKey = process.env.RESEND_API_KEY || "build-placeholder"
const resend = new Resend(resendApiKey)

export async function POST(req: Request) {
  const body = await req.json()
  const { emailContent, to, cc, subject } = body

  try {
    // Extract domain from NEXT_PUBLIC_SITE_URL for from address
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const domain = new URL(siteUrl).hostname

    const { data, error } = await resend.emails.send({
      from: `Docbase <noreply@${domain}>`,
      to: to,
      cc: cc,
      subject: subject,
      react: EmailTemplate({ emailContent }),
    })

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
