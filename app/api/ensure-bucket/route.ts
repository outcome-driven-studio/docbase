import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * API endpoint to ensure storage bucket exists
 * Can be called from setup or first-time upload
 */
export async function POST() {
  const supabase = createClient()

  try {
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === "cube")

    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: "Bucket already exists",
      })
    }

    // Try to create bucket
    const { error } = await supabase.storage.createBucket("cube", {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    })

    if (error) {
      // If error is "already exists", that's fine
      if (error.message.includes("already exists")) {
        return NextResponse.json({
          success: true,
          message: "Bucket already exists",
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "Please create bucket 'cube' manually in Supabase Dashboard → Storage",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Bucket created successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
