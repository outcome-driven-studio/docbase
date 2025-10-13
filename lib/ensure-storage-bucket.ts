import { createClient } from "@/utils/supabase/server"

/**
 * Ensures the storage bucket exists
 * Creates it if not found
 * Should be called during initial setup
 */
export async function ensureStorageBucket() {
  const supabase = createClient()

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return { success: false, error: listError.message }
    }

    const bucketExists = buckets?.some((b) => b.name === "cube")

    if (bucketExists) {
      return { success: true, message: "Bucket already exists" }
    }

    // Create bucket if it doesn't exist
    const { data, error: createError } = await supabase.storage.createBucket(
      "cube",
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      }
    )

    if (createError) {
      console.error("Error creating bucket:", createError)
      return { success: false, error: createError.message }
    }

    console.log("✅ Storage bucket 'cube' created successfully")
    return { success: true, message: "Bucket created successfully" }
  } catch (error: any) {
    console.error("Unexpected error ensuring bucket:", error)
    return { success: false, error: error.message }
  }
}
