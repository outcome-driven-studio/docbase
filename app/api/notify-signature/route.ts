import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { NewEmailTemplate } from "@/components/templates/new-email"
import { logger } from "@/lib/logger"
import {
  sendSlackNotification,
  createSignatureMessage,
} from "@/lib/slack"

const notifySignatureSchema = z.object({
  linkId: z.string().uuid(),
  signerEmail: z.string().email(),
  signerName: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const validationResult = notifySignatureSchema.safeParse(body)
    if (!validationResult.success) {
      logger.error("Validation failed for notify-signature", {
        errors: validationResult.error.errors,
        receivedData: body,
      })
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { linkId, signerEmail, signerName } = validationResult.data

    const supabase = createClient()

    // Get link details and creator information
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, name, filename, created_by")
      .eq("id", linkId)
      .single()

    if (linkError || !link) {
      logger.error("Link not found", { linkId, error: linkError })
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Get creator's email and domain info
    const { data: creator, error: creatorError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", link.created_by)
      .single()

    if (creatorError || !creator) {
      logger.error("Creator not found", {
        creatorId: link.created_by,
        error: creatorError,
      })
      return NextResponse.json(
        { error: "Document creator not found" },
        { status: 404 }
      )
    }

    // Get the creator's domain and API key (also get Slack credentials)
    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .select("api_key, domain_name, sender_name, slack_access_token, slack_channel_id")
      .eq("user_id", creator.id)
      .limit(1)
      .single()

    if (domainError || !domain || !domain.api_key) {
      logger.error("Domain/API key not found for creator", {
        creatorId: creator.id,
        error: domainError,
      })
      // Don't fail - just log the error
      return NextResponse.json(
        { warning: "Email notification skipped - no domain configured" },
        { status: 200 }
      )
    }

    const resend = new Resend(domain.api_key)

    const documentName = link.name || link.filename || "Document"
    const subject = `${signerName} has signed your document: ${documentName}`
    const emailBody = `
Hello ${creator.name || "there"},

${signerName} (${signerEmail}) has signed the document "${documentName}".

**Next Steps:**
Please sign the document to complete the signature workflow. You can view and sign the document by logging into your account.

**Document Details:**
- Document: ${documentName}
- Signer: ${signerName}
- Signer Email: ${signerEmail}
- Signed At: ${new Date().toLocaleString()}

Best regards,
Your Docbase Team
    `.trim()

    const { data, error } = await resend.emails.send({
      from: `${domain.sender_name} <hi@${domain.domain_name}>`,
      to: creator.email!,
      subject: subject,
      react: NewEmailTemplate({ emailBody }),
    })

    if (error) {
      logger.error("Resend API error", { error })
      return NextResponse.json(
        { error: "Failed to send email notification" },
        { status: 500 }
      )
    }

    logger.info("Signature notification sent", {
      linkId,
      creatorEmail: creator.email,
      signerEmail,
    })

    // Send Slack notification if configured (don't fail if Slack notification fails)
    try {
      if (domain?.slack_access_token && domain?.slack_channel_id) {
        const documentName = link.name || link.filename || "Document"
        const { text, blocks } = createSignatureMessage(
          documentName,
          signerName,
          signerEmail
        )

        await sendSlackNotification({
          accessToken: domain.slack_access_token,
          channelId: domain.slack_channel_id,
          text,
          blocks,
        })

        logger.info("Slack notification sent for signature", {
          linkId,
          signerEmail,
        })
      }
    } catch (slackError) {
      // Log but don't fail the request if Slack notification fails
      logger.error("Failed to send Slack notification for signature", {
        error: slackError,
        linkId,
      })
    }

    // Check if all parties have signed (both creator and signer)
    const { data: allSignatures } = await supabase
      .from("signatures")
      .select("signer_email, signer_name")
      .eq("link_id", linkId)

    if (allSignatures && allSignatures.length >= 2) {
      // Document is fully signed! Send completion notification to all parties
      logger.info("All parties have signed, sending completion notifications", {
        linkId,
      })

      // Send completion email to all signers
      const completionSubject = `All signatures complete: ${documentName}`
      const allSignersEmails = allSignatures.map((s: any) => s.signer_email)

      for (const signature of allSignatures) {
        try {
          const completionEmailBody = `
Hello ${signature.signer_name},

All parties have signed the document "${documentName}". The signing process is now complete!

**Document Details:**
- Document: ${documentName}
- All Signers: ${allSignatures.map((s: any) => s.signer_name).join(", ")}
- Completion Date: ${new Date().toLocaleString()}

This document is now legally binding and has been securely stored with complete audit trail.

Best regards,
Your Docbase Team
          `.trim()

          await resend.emails.send({
            from: `${domain.sender_name} <hi@${domain.domain_name}>`,
            to: signature.signer_email,
            subject: completionSubject,
            react: NewEmailTemplate({ emailBody: completionEmailBody }),
          })

          logger.info("Completion notification sent to", {
            email: signature.signer_email,
          })
        } catch (completionError) {
          logger.error("Failed to send completion notification", {
            email: signature.signer_email,
            error: completionError,
          })
        }
      }

      // Log certificate generation event
      await supabase.from("signature_events").insert({
        link_id: linkId,
        event_type: "certificate_generated",
        metadata: {
          all_signers: allSignatures.map((s: any) => ({
            email: s.signer_email,
            name: s.signer_name,
          })),
          completion_date: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error in notify-signature route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred" },
      { status: 500 }
    )
  }
}
