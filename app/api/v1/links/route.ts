import { NextResponse } from "next/server"
import { z } from "zod"
import * as bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { createServiceRoleClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

// Schema for link creation (now requires documentId)
const createLinkSchema = z.object({
  // Required: reference to document
  documentId: z.string().uuid("Document ID is required"),

  // Optional security fields
  password: z.string().optional(),
  expires: z.string().datetime().optional(), // ISO 8601 datetime string

  // Optional settings
  allowDownload: z.boolean().default(true),
  requireEmail: z.boolean().default(true),
  requireSignature: z.boolean().default(false),
  sendNotifications: z.boolean().default(true),

  // Optional customization (receiver page settings - link-specific)
  viewerPageHeading: z.string().optional(),
  viewerPageSubheading: z.string().optional(),
  viewerPageCoverLetter: z.string().optional(),
  viewerPageLogoUrl: z.string().url().optional(),
  signatureInstructions: z.string().optional(),
  coverLetterFont: z.enum(["cursive", "arial", "times", "georgia", "mono"]).default("cursive"),
  coverLetterColor: z.string().default("gray-800"),
  showCreatorSignature: z.boolean().default(false),

  // Optional folder (folder can be different from document's folder)
  folderId: z.string().uuid().optional(),
})

// Validate API key from header
async function validateApiKey(authHeader: string | null): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid authorization header. Expected format: 'Bearer YOUR_API_KEY'" }
  }

  const apiKey = authHeader.substring(7) // Remove "Bearer " prefix

  if (!apiKey || apiKey.length < 32) {
    return { userId: null, error: "Invalid API key format" }
  }

  // Hash the API key to compare with stored hash
  const keyHash = bcrypt.hashSync(apiKey, 10)

  // Use service role client to validate API key
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .rpc("validate_api_key", { api_key_hash: keyHash })
    .single()

  if (error || !data) {
    logger.error("API key validation failed", { error })
    return { userId: null, error: "Invalid or expired API key" }
  }

  if (!data.is_valid) {
    return { userId: null, error: "API key is inactive or expired" }
  }

  return { userId: data.user_id, error: null }
}

export async function POST(req: Request) {
  try {
    // Validate API key
    const authHeader = req.headers.get("authorization")
    const { userId, error: authError } = await validateApiKey(authHeader)

    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = createLinkSchema.safeParse(body)

    if (!validationResult.success) {
      logger.error("Validation failed for create link API", {
        errors: validationResult.error.errors,
        receivedData: body,
      })
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = createServiceRoleClient()

    // Validate document exists and belongs to user
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, filename, storage_path")
      .eq("id", data.documentId)
      .eq("created_by", userId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      )
    }

    // Validate folder exists and belongs to user if folder_id is provided
    if (data.folderId) {
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("id")
        .eq("id", data.folderId)
        .eq("created_by", userId)
        .single()

      if (folderError || !folder) {
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 }
        )
      }
    }

    // Hash password if provided
    let passwordHash = null
    if (data.password) {
      passwordHash = bcrypt.hashSync(data.password, 10)
    }

    // Generate link ID and signed URL
    const linkId = uuidv4()

    // Calculate expiration for signed URL
    let expirationSeconds: number
    if (data.expires) {
      const currentDate = new Date()
      const expirationDate = new Date(data.expires)
      expirationSeconds = Math.floor(
        (expirationDate.getTime() - currentDate.getTime()) / 1000
      )
    } else {
      expirationSeconds = 10 * 365 * 24 * 60 * 60 // 10 years
    }

    // Create signed URL for the document
    const { data: signedUrlData } = await supabase.storage
      .from("cube")
      .createSignedUrl(document.storage_path, expirationSeconds)

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to create signed URL for document" },
        { status: 500 }
      )
    }

    // Create the link record
    const { data: link, error: linkError } = await supabase
      .from("links")
      .insert({
        id: linkId,
        document_id: data.documentId,
        url: signedUrlData.signedUrl,
        password: passwordHash,
        expires: data.expires || null,
        allow_download: data.allowDownload,
        require_email: data.requireEmail,
        require_signature: data.requireSignature,
        send_notifications: data.sendNotifications,
        viewer_page_heading: data.viewerPageHeading || null,
        viewer_page_subheading: data.viewerPageSubheading || null,
        viewer_page_cover_letter: data.viewerPageCoverLetter || null,
        viewer_page_logo_url: data.viewerPageLogoUrl || null,
        signature_instructions: data.signatureInstructions || null,
        cover_letter_font: data.coverLetterFont,
        cover_letter_color: data.coverLetterColor,
        show_creator_signature: data.showCreatorSignature,
        folder_id: data.folderId || null,
        created_by: userId,
      })
      .select()
      .single()

    if (linkError) {
      logger.error("Error creating link via API", {
        userId,
        error: linkError,
      })
      return NextResponse.json(
        { error: "Failed to create link", details: linkError.message },
        { status: 500 }
      )
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/links/view/${linkId}`

    logger.info("Link created via API", {
      userId,
      linkId,
      documentId: data.documentId,
      documentFilename: document.filename,
    })

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        shareUrl,
        documentId: data.documentId,
        documentFilename: document.filename,
        createdAt: link.created_at,
        expires: link.expires,
        allowDownload: link.allow_download,
        requireEmail: link.require_email,
        requireSignature: link.require_signature,
        folderId: link.folder_id,
      },
    }, { status: 201 })

  } catch (error) {
    console.error("[create-link-api] Caught error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error in create link API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve links (optional - for API users to list their links)
export async function GET(req: Request) {
  try {
    // Validate API key
    const authHeader = req.headers.get("authorization")
    const { userId, error: authError } = await validateApiKey(authHeader)

    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get("folderId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = createServiceRoleClient()

    let query = supabase
      .from("links")
      .select(`
        id,
        created_at,
        expires,
        allow_download,
        require_email,
        require_signature,
        folder_id,
        viewer_page_heading,
        document_id,
        documents (
          id,
          filename,
          display_mode,
          file_size
        )
      `)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (folderId) {
      query = query.eq("folder_id", folderId)
    }

    const { data: links, error: linksError } = await query

    if (linksError) {
      logger.error("Error fetching links via API", {
        userId,
        error: linksError,
      })
      return NextResponse.json(
        { error: "Failed to fetch links", details: linksError.message },
        { status: 500 }
      )
    }

    // Transform and add share URLs to each link
    const linksWithUrls = links.map((link: any) => ({
      id: link.id,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/links/view/${link.id}`,
      createdAt: link.created_at,
      expires: link.expires,
      allowDownload: link.allow_download,
      requireEmail: link.require_email,
      requireSignature: link.require_signature,
      folderId: link.folder_id,
      viewerPageHeading: link.viewer_page_heading,
      documentId: link.document_id,
      document: link.documents ? {
        id: link.documents.id,
        filename: link.documents.filename,
        displayMode: link.documents.display_mode,
        fileSize: link.documents.file_size,
      } : null,
    }))

    return NextResponse.json({
      success: true,
      links: linksWithUrls,
      pagination: {
        limit,
        offset,
        total: links.length,
      },
    })

  } catch (error) {
    console.error("[get-links-api] Caught error:", error)
    logger.error("Unexpected error in get links API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}
