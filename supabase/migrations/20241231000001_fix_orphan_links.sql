-- Migration to fix orphan links (links without document_id)
-- Creates documents for any links that don't have an associated document

-- Step 1: Create documents table if it doesn't exist (safety check)
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    filename text NOT NULL,
    storage_path text NOT NULL,
    file_size bigint,
    mime_type text,
    display_mode text DEFAULT 'auto' CHECK (display_mode IN ('auto', 'slideshow', 'document')),
    folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can view their own documents'
    ) THEN
        CREATE POLICY "Users can view their own documents" ON public.documents
            FOR SELECT USING (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can insert their own documents'
    ) THEN
        CREATE POLICY "Users can insert their own documents" ON public.documents
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can update their own documents'
    ) THEN
        CREATE POLICY "Users can update their own documents" ON public.documents
            FOR UPDATE USING (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can delete their own documents'
    ) THEN
        CREATE POLICY "Users can delete their own documents" ON public.documents
            FOR DELETE USING (auth.uid() = created_by);
    END IF;
END
$$;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS documents_created_by_idx ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON public.documents(folder_id);

-- Step 5: Add document_id column to links if it doesn't exist
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;

-- Step 6: Create index for document_id in links
CREATE INDEX IF NOT EXISTS links_document_id_idx ON public.links(document_id);

-- Step 7: Migrate orphan links by creating documents for them
-- This handles links that were created before the documents table existed
INSERT INTO public.documents (id, created_by, filename, storage_path, display_mode, folder_id, created_at, file_size, mime_type)
SELECT
    l.id as id,  -- Use link id as document id
    l.created_by,
    COALESCE(l.filename, l.name, 'Unnamed Document') as filename,
    COALESCE(l.url, l.id::text) as storage_path,  -- Use link's storage path or ID
    COALESCE(l.display_mode, 'auto') as display_mode,
    l.folder_id,
    l.created_at,
    NULL as file_size,  -- We don't have this info for old links
    'application/pdf' as mime_type  -- Assume PDF for legacy links
FROM public.links l
WHERE l.document_id IS NULL  -- Only migrate links without documents
ON CONFLICT (id) DO NOTHING;

-- Step 8: Update links to reference the documents we just created
UPDATE public.links l
SET document_id = l.id  -- Set document_id to the same id (since we used link id for document)
WHERE l.document_id IS NULL;

-- Step 9: Verify the migration
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM public.links
    WHERE document_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Still have % orphan links without documents', orphan_count;
    ELSE
        RAISE NOTICE 'All links now have associated documents';
    END IF;
END
$$;

-- Step 10: Update the get_user_documents_with_links function to handle all cases
CREATE OR REPLACE FUNCTION public.get_user_documents_with_links(id_arg uuid)
RETURNS TABLE (
    document_id uuid,
    document_filename text,
    document_storage_path text,
    document_file_size bigint,
    document_mime_type text,
    document_display_mode text,
    document_created_at timestamp with time zone,
    document_updated_at timestamp with time zone,
    links jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id as document_id,
        d.filename as document_filename,
        d.storage_path as document_storage_path,
        d.file_size as document_file_size,
        d.mime_type as document_mime_type,
        d.display_mode as document_display_mode,
        d.created_at as document_created_at,
        d.updated_at as document_updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', l.id,
                    'created_at', l.created_at,
                    'expires', l.expires,
                    'password', l.password,
                    'require_email', l.require_email,
                    'require_signature', l.require_signature,
                    'allow_download', l.allow_download,
                    'viewer_page_heading', l.viewer_page_heading,
                    'viewer_page_subheading', l.viewer_page_subheading,
                    'view_count', (SELECT COUNT(*) FROM public.viewers v WHERE v.link_id = l.id)
                ) ORDER BY l.created_at DESC
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'::jsonb
        ) as links
    FROM public.documents d
    LEFT JOIN public.links l ON l.document_id = d.id
    WHERE d.created_by = id_arg
    GROUP BY d.id
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Update the get_document_with_links function
CREATE OR REPLACE FUNCTION public.get_document_with_links(document_id_arg uuid, user_id_arg uuid)
RETURNS TABLE (
    document_id uuid,
    document_filename text,
    document_storage_path text,
    document_file_size bigint,
    document_mime_type text,
    document_display_mode text,
    document_created_at timestamp with time zone,
    document_updated_at timestamp with time zone,
    links jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id as document_id,
        d.filename as document_filename,
        d.storage_path as document_storage_path,
        d.file_size as document_file_size,
        d.mime_type as document_mime_type,
        d.display_mode as document_display_mode,
        d.created_at as document_created_at,
        d.updated_at as document_updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', l.id,
                    'created_at', l.created_at,
                    'expires', l.expires,
                    'password', CASE WHEN l.password IS NOT NULL THEN true ELSE false END,
                    'require_email', l.require_email,
                    'require_signature', l.require_signature,
                    'allow_download', l.allow_download,
                    'viewer_page_heading', l.viewer_page_heading,
                    'viewer_page_subheading', l.viewer_page_subheading,
                    'view_count', (SELECT COUNT(*) FROM public.viewers v WHERE v.link_id = l.id)
                ) ORDER BY l.created_at DESC
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'::jsonb
        ) as links
    FROM public.documents d
    LEFT JOIN public.links l ON l.document_id = d.id
    WHERE d.id = document_id_arg AND d.created_by = user_id_arg
    GROUP BY d.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
