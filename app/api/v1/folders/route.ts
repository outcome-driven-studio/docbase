import { NextResponse } from "next/server"
import { z } from "zod"
import * as bcrypt from "bcryptjs"
import { createServiceRoleClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

// Schema for folder creation
const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Folder name too long"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color").default("#6B7280"),
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
    .single<{ user_id: string; is_valid: boolean }>()

  if (error || !data) {
    logger.error("API key validation failed", { error })
    return { userId: null, error: "Invalid or expired API key" }
  }

  if (!data.is_valid) {
    return { userId: null, error: "API key is inactive or expired" }
  }

  return { userId: data.user_id, error: null }
}

// GET folders
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

    const supabase = createServiceRoleClient()

    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("id, name, color, created_at, updated_at")
      .eq("created_by", userId)
      .order("name", { ascending: true })

    if (foldersError) {
      logger.error("Error fetching folders via API", {
        userId,
        error: foldersError,
      })
      return NextResponse.json(
        { error: "Failed to fetch folders", details: foldersError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      folders,
    })

  } catch (error) {
    console.error("[get-folders-api] Caught error:", error)
    logger.error("Unexpected error in get folders API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}

// POST create folder
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
    const validationResult = createFolderSchema.safeParse(body)

    if (!validationResult.success) {
      logger.error("Validation failed for create folder API", {
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

    // Check if folder with same name already exists for this user
    const { data: existingFolder } = await supabase
      .from("folders")
      .select("id")
      .eq("created_by", userId)
      .eq("name", data.name)
      .single()

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 409 }
      )
    }

    // Create the folder
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .insert({
        name: data.name,
        color: data.color,
        created_by: userId,
      })
      .select()
      .single()

    if (folderError) {
      logger.error("Error creating folder via API", {
        userId,
        error: folderError,
      })
      return NextResponse.json(
        { error: "Failed to create folder", details: folderError.message },
        { status: 500 }
      )
    }

    logger.info("Folder created via API", {
      userId,
      folderId: folder.id,
      folderName: data.name,
    })

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.created_at,
      },
    }, { status: 201 })

  } catch (error) {
    console.error("[create-folder-api] Caught error:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    logger.error("Unexpected error in create folder API route", { error })
    return NextResponse.json(
      { error: "Unexpected error occurred", details: String(error) },
      { status: 500 }
    )
  }
}
