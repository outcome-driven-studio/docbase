-- Migration to consolidate documents and links structure
-- Creates functions to get documents with their associated links

-- Function to get all documents with their links for a user
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
    links jsonb  -- Array of links for this document
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

-- Function to get a single document with all its links
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
