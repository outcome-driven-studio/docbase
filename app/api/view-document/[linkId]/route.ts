import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const supabase = createClient()
    const linkId = params.linkId

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the link to verify access
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, created_by, expires, password")
      .eq("id", linkId)
      .single()

    if (linkError || !link) {
      logger.error("Link not found", { linkError })
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Check if link has expired
    if (link.expires) {
      const expirationDate = new Date(link.expires)
      if (expirationDate < new Date()) {
        return NextResponse.json({ error: "Link has expired" }, { status: 403 })
      }
    }

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("cube")
      .download(linkId)

    if (downloadError || !fileData) {
      logger.error("Error downloading file", { downloadError })
      return NextResponse.json(
        { error: "Failed to retrieve document" },
        { status: 500 }
      )
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Return the PDF with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Disposition": "inline",
        // Security headers to prevent caching and downloading
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    })
  } catch (error: any) {
    logger.error("Unexpected error in view-document", { error })
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
