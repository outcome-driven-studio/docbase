-- Migration to add document versioning support
-- This allows tracking slide time across different versions of a document

-- Step 1: Add version tracking to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS total_pages integer,
ADD COLUMN IF NOT EXISTS version_notes text;

-- Create index on version for faster queries
CREATE INDEX IF NOT EXISTS documents_version_idx ON public.documents(id, version);

-- Step 2: Create a document_versions history table to track all versions
CREATE TABLE IF NOT EXISTS public.document_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    
    -- Reference to document
    document_id uuid NOT NULL,
    version integer NOT NULL,
    
    -- Version metadata
    filename text NOT NULL,
    storage_path text NOT NULL, -- Unique storage path for this version
    file_size bigint,
    mime_type text,
    total_pages integer,
    version_notes text,
    
    -- Who created this version
    created_by uuid NOT NULL,
    
    -- Whether this is the current version
    is_current boolean DEFAULT true,
    
    CONSTRAINT document_versions_pkey PRIMARY KEY (id),
    CONSTRAINT document_versions_document_id_version_unique UNIQUE (document_id, version),
    CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_versions
CREATE POLICY "Users can view versions of their own documents" ON public.document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
      AND d.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions of their own documents" ON public.document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
      AND d.created_by = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS document_versions_document_id_version_idx ON public.document_versions(document_id, version);
CREATE INDEX IF NOT EXISTS document_versions_is_current_idx ON public.document_versions(document_id, is_current);

-- Step 3: Add document_version to page_views table
ALTER TABLE public.page_views
ADD COLUMN IF NOT EXISTS document_version integer DEFAULT 1;

-- Create index for version-based queries
CREATE INDEX IF NOT EXISTS page_views_link_version_idx ON public.page_views(link_id, document_version);
CREATE INDEX IF NOT EXISTS page_views_viewer_version_idx ON public.page_views(viewer_id, document_version);

-- Step 4: Create function to get the current document version for a link
CREATE OR REPLACE FUNCTION public.get_link_document_version(link_id_arg uuid)
RETURNS integer AS $$
DECLARE
    doc_version integer;
BEGIN
    SELECT d.version INTO doc_version
    FROM public.links l
    INNER JOIN public.documents d ON l.document_id = d.id
    WHERE l.id = link_id_arg;
    
    RETURN COALESCE(doc_version, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update page analytics function to support version filtering
CREATE OR REPLACE FUNCTION public.get_link_page_analytics_by_version(
    link_id_arg uuid,
    version_arg integer DEFAULT NULL
)
RETURNS TABLE (
    page_number integer,
    total_views bigint,
    total_time_seconds bigint,
    avg_time_seconds numeric,
    unique_viewers bigint,
    document_version integer
) AS $$
BEGIN
    IF version_arg IS NULL THEN
        -- If no version specified, return data for all versions grouped by version
        RETURN QUERY
        SELECT
            pv.page_number,
            COUNT(*)::bigint as total_views,
            SUM(pv.time_spent_seconds)::bigint as total_time_seconds,
            ROUND(AVG(pv.time_spent_seconds)::numeric, 2) as avg_time_seconds,
            COUNT(DISTINCT pv.viewer_id)::bigint as unique_viewers,
            pv.document_version
        FROM public.page_views pv
        WHERE pv.link_id = link_id_arg
        GROUP BY pv.page_number, pv.document_version
        ORDER BY pv.document_version DESC, pv.page_number ASC;
    ELSE
        -- Return data for specific version only
        RETURN QUERY
        SELECT
            pv.page_number,
            COUNT(*)::bigint as total_views,
            SUM(pv.time_spent_seconds)::bigint as total_time_seconds,
            ROUND(AVG(pv.time_spent_seconds)::numeric, 2) as avg_time_seconds,
            COUNT(DISTINCT pv.viewer_id)::bigint as unique_viewers,
            pv.document_version
        FROM public.page_views pv
        WHERE pv.link_id = link_id_arg
        AND pv.document_version = version_arg
        GROUP BY pv.page_number, pv.document_version
        ORDER BY pv.page_number ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to get per-viewer, per-version page analytics
CREATE OR REPLACE FUNCTION public.get_viewer_session_analytics(
    link_id_arg uuid,
    version_arg integer DEFAULT NULL
)
RETURNS TABLE (
    viewer_id uuid,
    viewer_email text,
    session_id text,
    document_version integer,
    page_number integer,
    time_spent_seconds integer,
    viewed_at timestamp with time zone,
    total_session_time bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.viewer_id,
        v.email as viewer_email,
        pv.session_id,
        pv.document_version,
        pv.page_number,
        pv.time_spent_seconds,
        pv.created_at as viewed_at,
        SUM(pv.time_spent_seconds) OVER (PARTITION BY pv.session_id) as total_session_time
    FROM public.page_views pv
    LEFT JOIN public.viewers v ON pv.viewer_id = v.id
    WHERE pv.link_id = link_id_arg
    AND (version_arg IS NULL OR pv.document_version = version_arg)
    ORDER BY pv.viewer_id, pv.session_id, pv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to get all versions of a document
CREATE OR REPLACE FUNCTION public.get_document_versions(document_id_arg uuid)
RETURNS TABLE (
    version integer,
    filename text,
    total_pages integer,
    version_notes text,
    created_at timestamp with time zone,
    created_by uuid,
    is_current boolean,
    total_views bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dv.version,
        dv.filename,
        dv.total_pages,
        dv.version_notes,
        dv.created_at,
        dv.created_by,
        dv.is_current,
        COUNT(DISTINCT pv.id)::bigint as total_views
    FROM public.document_versions dv
    LEFT JOIN public.links l ON l.document_id = dv.document_id
    LEFT JOIN public.page_views pv ON pv.link_id = l.id AND pv.document_version = dv.version
    WHERE dv.document_id = document_id_arg
    GROUP BY dv.id, dv.version, dv.filename, dv.total_pages, dv.version_notes, dv.created_at, dv.created_by, dv.is_current
    ORDER BY dv.version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to create a new version when document is updated
CREATE OR REPLACE FUNCTION public.create_document_version(
    document_id_arg uuid,
    new_filename text,
    new_storage_path text,
    new_file_size bigint,
    new_mime_type text,
    new_total_pages integer,
    version_notes_arg text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_version integer;
    version_id uuid;
    doc_creator uuid;
BEGIN
    -- Get the document creator
    SELECT created_by INTO doc_creator
    FROM public.documents
    WHERE id = document_id_arg;
    
    IF doc_creator IS NULL THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    -- Get the next version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO new_version
    FROM public.document_versions
    WHERE document_id = document_id_arg;
    
    -- Mark all previous versions as not current
    UPDATE public.document_versions
    SET is_current = false
    WHERE document_id = document_id_arg;
    
    -- Create the new version record
    INSERT INTO public.document_versions (
        document_id,
        version,
        filename,
        storage_path,
        file_size,
        mime_type,
        total_pages,
        version_notes,
        created_by,
        is_current
    ) VALUES (
        document_id_arg,
        new_version,
        new_filename,
        new_storage_path,
        new_file_size,
        new_mime_type,
        new_total_pages,
        version_notes_arg,
        doc_creator,
        true
    ) RETURNING id INTO version_id;
    
    -- Update the documents table with new version info
    UPDATE public.documents
    SET 
        version = new_version,
        filename = new_filename,
        storage_path = new_storage_path,
        file_size = new_file_size,
        mime_type = new_mime_type,
        total_pages = new_total_pages,
        version_notes = version_notes_arg,
        updated_at = now()
    WHERE id = document_id_arg;
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Migrate existing documents to version 1
-- Create initial version records for all existing documents
INSERT INTO public.document_versions (
    document_id,
    version,
    filename,
    storage_path,
    file_size,
    mime_type,
    total_pages,
    created_by,
    is_current,
    created_at
)
SELECT 
    d.id,
    1,
    d.filename,
    d.storage_path,
    d.file_size,
    d.mime_type,
    d.total_pages,
    d.created_by,
    true,
    d.created_at
FROM public.documents d
WHERE NOT EXISTS (
    SELECT 1 FROM public.document_versions dv
    WHERE dv.document_id = d.id AND dv.version = 1
)
ON CONFLICT (document_id, version) DO NOTHING;

-- Update existing page_views to version 1 if they don't have a version
UPDATE public.page_views
SET document_version = 1
WHERE document_version IS NULL OR document_version = 0;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_link_document_version(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_link_page_analytics_by_version(uuid, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_viewer_session_analytics(uuid, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_document_versions(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_document_version(uuid, text, text, bigint, text, integer, text) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.document_versions IS 'Tracks all versions of documents. Each time a document is updated, a new version is created.';
COMMENT ON COLUMN public.document_versions.version IS 'Sequential version number starting at 1';
COMMENT ON COLUMN public.document_versions.is_current IS 'Whether this is the currently active version';
COMMENT ON COLUMN public.page_views.document_version IS 'Version of the document when this page was viewed';
COMMENT ON FUNCTION public.get_link_page_analytics_by_version IS 'Get page analytics filtered by document version';
COMMENT ON FUNCTION public.get_viewer_session_analytics IS 'Get detailed per-viewer, per-session analytics with version tracking';
