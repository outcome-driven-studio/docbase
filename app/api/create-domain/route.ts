import { NextResponse } from "next/server"
import { Resend } from "resend"

import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const { domainName, apiKey } = await req.json()
  const resend = new Resend(apiKey)

  try {
    const createResult = await resend.domains.create({ name: domainName })

    if (createResult.error) {
      throw createResult.error
    }

    return NextResponse.json({ id: createResult.data?.id })
  } catch (error: any) {
    logger.error("Error creating domain", { error, domainName })

    // If the domain is already registered, fetch the list of domains and return the existing domain
    if (
      error.statusCode === 403 &&
      error.name === "validation_error" &&
      error.message.includes("has been registered already")
    ) {
      const listResult = await resend.domains.list()
      if (listResult.error) {
        throw listResult.error
      }

      const domains = listResult?.data?.data
      const existingDomain = domains?.find((d: any) => d.name === domainName)

      if (existingDomain) {
        return NextResponse.json({ id: existingDomain.id })
      } else {
        throw new Error("Domain not found after creation attempt")
      }
    }

    // Provide more helpful error messages
    let errorMessage = error.message || "Unknown error"

    if (error.statusCode === 401 || error.statusCode === 403) {
      errorMessage = "Invalid API key. Please check your Resend API key."
    } else if (error.message?.includes("domain")) {
      errorMessage = `Domain error: ${error.message}. Make sure you've added this domain in Resend Dashboard first.`
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.statusCode || 500 }
    )
  }
}
