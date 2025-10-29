-- Create documents table for uploaded files
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,

    -- File information
    filename text NOT NULL,
    storage_path text NOT NULL, -- Path in storage bucket
    file_size bigint, -- Size in bytes
    mime_type text,

    -- Document settings (applied to all links)
    display_mode text DEFAULT 'auto' CHECK (display_mode IN ('auto', 'slideshow', 'document')),

    -- Organization
    folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,

    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS documents_created_by_idx ON public.documents(created_by);
CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON public.documents(folder_id);

-- Modify links table to reference documents and remove document-specific fields
-- First, add document_id column
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;

-- Move display_mode to documents table (already added above)
-- Remove fields that should be document-specific, not link-specific
-- Note: We'll keep filename temporarily for backward compatibility during migration

-- Create index for document_id in links
CREATE INDEX IF NOT EXISTS links_document_id_idx ON public.links(document_id);

-- Create function to get links with document info
CREATE OR REPLACE FUNCTION public.get_user_links_with_document_info(id_arg uuid)
RETURNS TABLE (
    link_id uuid,
    link_created_at timestamp with time zone,
    link_expires timestamp with time zone,
    link_password text,
    link_require_email boolean,
    link_require_signature boolean,
    link_allow_download boolean,
    link_viewer_page_heading text,
    link_viewer_page_subheading text,
    link_viewer_page_cover_letter text,
    link_viewer_page_logo_url text,
    link_cover_letter_font text,
    link_cover_letter_color text,
    link_show_creator_signature boolean,
    link_signature_instructions text,
    link_folder_id uuid,
    document_id uuid,
    document_filename text,
    document_display_mode text,
    document_file_size bigint,
    view_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id as link_id,
        l.created_at as link_created_at,
        l.expires as link_expires,
        l.password as link_password,
        l.require_email as link_require_email,
        l.require_signature as link_require_signature,
        l.allow_download as link_allow_download,
        l.viewer_page_heading as link_viewer_page_heading,
        l.viewer_page_subheading as link_viewer_page_subheading,
        l.viewer_page_cover_letter as link_viewer_page_cover_letter,
        l.viewer_page_logo_url as link_viewer_page_logo_url,
        l.cover_letter_font as link_cover_letter_font,
        l.cover_letter_color as link_cover_letter_color,
        l.show_creator_signature as link_show_creator_signature,
        l.signature_instructions as link_signature_instructions,
        l.folder_id as link_folder_id,
        d.id as document_id,
        d.filename as document_filename,
        d.display_mode as document_display_mode,
        d.file_size as document_file_size,
        COUNT(DISTINCT v.id)::bigint as view_count
    FROM public.links l
    LEFT JOIN public.documents d ON l.document_id = d.id
    LEFT JOIN public.viewers v ON l.id = v.link_id
    WHERE l.created_by = id_arg
    GROUP BY l.id, d.id
    ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get a single link with document info (for viewing)
CREATE OR REPLACE FUNCTION public.get_link_with_document(link_id_arg uuid)
RETURNS TABLE (
    link_id uuid,
    link_url text,
    link_password text,
    link_expires timestamp with time zone,
    link_require_email boolean,
    link_require_signature boolean,
    link_allow_download boolean,
    link_viewer_page_heading text,
    link_viewer_page_subheading text,
    link_viewer_page_cover_letter text,
    link_viewer_page_logo_url text,
    link_cover_letter_font text,
    link_cover_letter_color text,
    link_show_creator_signature boolean,
    link_signature_instructions text,
    document_id uuid,
    document_filename text,
    document_display_mode text,
    document_storage_path text,
    creator_signature_url text,
    creator_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id as link_id,
        l.url as link_url,
        l.password as link_password,
        l.expires as link_expires,
        l.require_email as link_require_email,
        l.require_signature as link_require_signature,
        l.allow_download as link_allow_download,
        l.viewer_page_heading as link_viewer_page_heading,
        l.viewer_page_subheading as link_viewer_page_subheading,
        l.viewer_page_cover_letter as link_viewer_page_cover_letter,
        l.viewer_page_logo_url as link_viewer_page_logo_url,
        l.cover_letter_font as link_cover_letter_font,
        l.cover_letter_color as link_cover_letter_color,
        l.show_creator_signature as link_show_creator_signature,
        l.signature_instructions as link_signature_instructions,
        d.id as document_id,
        d.filename as document_filename,
        d.display_mode as document_display_mode,
        d.storage_path as document_storage_path,
        u.signature_url as creator_signature_url,
        u.name as creator_name
    FROM public.links l
    LEFT JOIN public.documents d ON l.document_id = d.id
    LEFT JOIN public.users u ON l.created_by = u.id
    WHERE l.id = link_id_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data migration: Create documents from existing links
-- This will help migrate existing data
INSERT INTO public.documents (id, created_by, filename, storage_path, display_mode, folder_id, created_at)
SELECT
    l.id as id,  -- Use link id as document id for now
    l.created_by,
    COALESCE(l.filename, 'Unnamed Document') as filename,
    l.id as storage_path,  -- Storage path is same as link id
    COALESCE(l.display_mode, 'auto') as display_mode,
    l.folder_id,
    l.created_at
FROM public.links l
WHERE l.document_id IS NULL  -- Only migrate links that don't have documents yet
ON CONFLICT (id) DO NOTHING;

-- Update links to reference the documents we just created
UPDATE public.links l
SET document_id = l.id  -- Set document_id to the same id (since we used link id for document)
WHERE l.document_id IS NULL;

-- Note: We keep url, filename, and display_mode in links table for backward compatibility
-- These can be removed in a future migration once all code is updated
