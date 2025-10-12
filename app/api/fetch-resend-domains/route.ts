import { NextResponse } from "next/server"
import { Resend } from "resend"

import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    const resend = new Resend(apiKey)
    const listResult = await resend.domains.list()

    if (listResult.error) {
      logger.error("Error fetching domains from Resend", {
        error: listResult.error,
      })

      const errorMessage = listResult.error.message || "Failed to fetch domains"

      // Check if it's an auth error
      if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("Unauthorized")
      ) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    const domains = listResult.data?.data || []

    // Filter to only verified/ready domains
    const verifiedDomains = domains.filter(
      (d: any) => d.status === "verified" || d.status === "pending"
    )

    return NextResponse.json({
      domains: verifiedDomains.map((d: any) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        region: d.region,
      })),
    })
  } catch (error: any) {
    logger.error("Unexpected error in fetch-resend-domains", { error })
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
