import { NextResponse } from "next/server"
import { z } from "zod"
import * as bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { createServiceRoleClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

// Schema for document creation
const createDocumentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileUrl: z.string().url("File URL must be a valid URL"),
  displayMode: z.enum(["auto", "slideshow", "document"]).default("auto"),
  folderId: z.string().uuid().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

// Schema for document update
const updateDocumentSchema = z.object({
  filename: z.string().min(1).optional(),
  displayMode: z.enum(["auto", "slideshow", "document"]).optional(),
  folderId: z.string().uuid().nullable().optional(),
})

// Validate API key from header
async function validateApiKey(authHeader: string | null): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid authorization header. Expected format: 'Bearer YOUR_API_KEY'" }
  }

  const apiKey = authHeader.substring(7)

  if (!apiKey || apiKey.length < 32) {
    return { userId: null, error: "Invalid API key format" }
  }

  const keyHash = bcrypt.hashSync(apiKey, 10)
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

// POST - Create a document
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    const { userId, error: authError } = await validateApiKey(authHeader)

    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validationResult = createDocumentSchema.safeParse(body)

    if (!validationResult.success) {
      logger.error("Validation failed for create document API", {
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

    // Validate folder if provided
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

    const documentId = uuidv4()

    // Create the document record
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        id: documentId,
        filename: data.filename,
        storage_path: documentId, // Use document ID as storage path
        display_mode: data.displayMode,
        folder_id: data.folderId || null,
        file_size: data.fileSize || null,
        mime_type: data.mimeType || null,
        created_by: userId,
      })
      .select()
      .single()

    if (documentError) {
      logger.error("Error creating document via API", {
        userId,
        error: documentError,
      })
      return NextResponse.json(
        { error: "Failed to create document", details: documentError.message },
        { status: 500 }
      )
    }

    logger.info("Document created via API", {
      userId,
      documentId,
      filename: data.filename,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        displayMode: document.display_mode,
        folderId: document.folder_id,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        createdAt: document.created_at,
      },
    }, { status: 201 })

  } catch (error) {
    console.error("[create-document-api] Caught error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error in create document API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}

// GET - List documents
export async function GET(req: Request) {
  try {
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
      .from("documents")
      .select(`
        *,
        links:links(count)
      `)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (folderId) {
      query = query.eq("folder_id", folderId)
    }

    const { data: documents, error: documentsError } = await query

    if (documentsError) {
      logger.error("Error fetching documents via API", {
        userId,
        error: documentsError,
      })
      return NextResponse.json(
        { error: "Failed to fetch documents", details: documentsError.message },
        { status: 500 }
      )
    }

    // Transform the data
    const documentsWithLinkCount = documents.map((doc: any) => ({
      id: doc.id,
      filename: doc.filename,
      displayMode: doc.display_mode,
      folderId: doc.folder_id,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      linkCount: doc.links?.[0]?.count || 0,
    }))

    return NextResponse.json({
      success: true,
      documents: documentsWithLinkCount,
      pagination: {
        limit,
        offset,
        total: documents.length,
      },
    })

  } catch (error) {
    console.error("[get-documents-api] Caught error:", error)
    logger.error("Unexpected error in get documents API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}
