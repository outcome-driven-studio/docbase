import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { bucketName } = await req.json()

    if (!bucketName) {
      return NextResponse.json(
        { success: false, error: "Bucket name is required" },
        { status: 400 }
      )
    }

    // Validate bucket name format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(bucketName)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bucket name must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some((b) => b.name === bucketName)

    if (exists) {
      // Store bucket name in user settings for future use
      await supabase
        .from("users")
        .update({ storage_bucket_name: bucketName })
        .eq("id", user.id)

      return NextResponse.json({
        success: true,
        message: "Bucket already exists",
        bucketName,
      })
    }

    // Create new bucket (PRIVATE for security)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false, // Private bucket - access via signed URLs only
      fileSizeLimit: 52428800, // 50MB
    })

    if (error) {
      logger.error("Error creating storage bucket", { error, bucketName })

      // Check if it's already exists error
      if (error.message.includes("already exists")) {
        await supabase
          .from("users")
          .update({ storage_bucket_name: bucketName })
          .eq("id", user.id)

        return NextResponse.json({
          success: true,
          message: "Bucket already exists",
          bucketName,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "You may need to create the bucket manually in Supabase Dashboard",
        },
        { status: 500 }
      )
    }

    // Store bucket name in user settings
    await supabase
      .from("users")
      .update({ storage_bucket_name: bucketName })
      .eq("id", user.id)

    logger.info("Storage bucket created", { bucketName, userId: user.id })

    return NextResponse.json({
      success: true,
      message: "Bucket created successfully",
      bucketName,
    })
  } catch (error: any) {
    logger.error("Unexpected error in create-storage-bucket", { error })
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
