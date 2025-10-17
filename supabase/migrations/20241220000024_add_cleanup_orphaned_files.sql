-- Add function to clean up orphaned storage files
-- This helps clean up files that exist in storage but have no corresponding link in the database

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage_files()
RETURNS TABLE (
  deleted_file text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  storage_file RECORD;
  file_exists BOOLEAN;
BEGIN
  -- Loop through all files in the 'cube' bucket
  FOR storage_file IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'cube'
  LOOP
    -- Check if there's a corresponding link in the database
    SELECT EXISTS(
      SELECT 1
      FROM public.links
      WHERE id::text = storage_file.name
    ) INTO file_exists;

    -- If no corresponding link exists, delete the file
    IF NOT file_exists THEN
      BEGIN
        PERFORM storage.delete_object('cube', storage_file.name);
        deleted_file := storage_file.name;
        status := 'deleted';
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        deleted_file := storage_file.name;
        status := 'error: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage_files() TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.cleanup_orphaned_storage_files() IS
'Cleans up orphaned files in storage that have no corresponding link record in the database. Returns a list of deleted files and their status.';
