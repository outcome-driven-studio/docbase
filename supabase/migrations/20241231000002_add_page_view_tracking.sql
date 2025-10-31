-- Migration to add page view tracking with time spent per page

-- Create page_views table to track detailed viewing behavior
CREATE TABLE IF NOT EXISTS public.page_views (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    
    -- Link and viewer identification
    link_id uuid NOT NULL,
    viewer_id uuid,
    session_id text NOT NULL, -- Browser session identifier
    
    -- Page information
    page_number integer NOT NULL,
    
    -- Time tracking
    time_spent_seconds integer NOT NULL DEFAULT 0, -- Time spent on this page in seconds
    entered_at timestamp with time zone DEFAULT now(),
    exited_at timestamp with time zone,
    
    -- Metadata
    user_agent text,
    ip_address text
);

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'page_views_pkey' 
        AND conrelid = 'public.page_views'::regclass
    ) THEN
        ALTER TABLE public.page_views ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'page_views_link_id_fkey'
    ) THEN
        ALTER TABLE public.page_views 
        ADD CONSTRAINT page_views_link_id_fkey 
        FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'page_views_viewer_id_fkey'
    ) THEN
        ALTER TABLE public.page_views 
        ADD CONSTRAINT page_views_viewer_id_fkey 
        FOREIGN KEY (viewer_id) REFERENCES public.viewers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for page_views
DO $$
BEGIN
    -- Users can view page views for their own links
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'page_views' 
        AND policyname = 'Users can view page views for their own links'
    ) THEN
        CREATE POLICY "Users can view page views for their own links" ON public.page_views
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.links l
                    WHERE l.id = page_views.link_id
                    AND l.created_by = auth.uid()
                )
            );
    END IF;

    -- Allow inserting page views (public can track when viewing)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'page_views' 
        AND policyname = 'Anyone can insert page views'
    ) THEN
        CREATE POLICY "Anyone can insert page views" ON public.page_views
            FOR INSERT 
            WITH CHECK (true);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS page_views_link_id_idx ON public.page_views(link_id);
CREATE INDEX IF NOT EXISTS page_views_viewer_id_idx ON public.page_views(viewer_id);
CREATE INDEX IF NOT EXISTS page_views_session_id_idx ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS page_views_page_number_idx ON public.page_views(page_number);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views(created_at);

-- Function to get page time analytics for a link
CREATE OR REPLACE FUNCTION public.get_link_page_analytics(link_id_arg uuid)
RETURNS TABLE (
    page_number integer,
    total_views bigint,
    total_time_seconds bigint,
    avg_time_seconds numeric,
    unique_viewers bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.page_number,
        COUNT(*)::bigint as total_views,
        SUM(pv.time_spent_seconds)::bigint as total_time_seconds,
        ROUND(AVG(pv.time_spent_seconds)::numeric, 2) as avg_time_seconds,
        COUNT(DISTINCT pv.viewer_id)::bigint as unique_viewers
    FROM public.page_views pv
    WHERE pv.link_id = link_id_arg
    GROUP BY pv.page_number
    ORDER BY pv.page_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get viewer-specific page analytics
CREATE OR REPLACE FUNCTION public.get_viewer_page_analytics(viewer_id_arg uuid)
RETURNS TABLE (
    page_number integer,
    time_spent_seconds integer,
    viewed_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.page_number,
        pv.time_spent_seconds,
        pv.created_at as viewed_at
    FROM public.page_views pv
    WHERE pv.viewer_id = viewer_id_arg
    ORDER BY pv.page_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document-level analytics (aggregate all links for a document)
CREATE OR REPLACE FUNCTION public.get_document_page_analytics(document_id_arg uuid)
RETURNS TABLE (
    page_number integer,
    total_views bigint,
    total_time_seconds bigint,
    avg_time_seconds numeric,
    unique_viewers bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.page_number,
        COUNT(*)::bigint as total_views,
        SUM(pv.time_spent_seconds)::bigint as total_time_seconds,
        ROUND(AVG(pv.time_spent_seconds)::numeric, 2) as avg_time_seconds,
        COUNT(DISTINCT pv.viewer_id)::bigint as unique_viewers
    FROM public.page_views pv
    INNER JOIN public.links l ON pv.link_id = l.id
    WHERE l.document_id = document_id_arg
    GROUP BY pv.page_number
    ORDER BY pv.page_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session-based page flow
CREATE OR REPLACE FUNCTION public.get_session_page_flow(session_id_arg text, link_id_arg uuid)
RETURNS TABLE (
    page_number integer,
    time_spent_seconds integer,
    entered_at timestamp with time zone,
    exited_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.page_number,
        pv.time_spent_seconds,
        pv.entered_at,
        pv.exited_at
    FROM public.page_views pv
    WHERE pv.session_id = session_id_arg
    AND pv.link_id = link_id_arg
    ORDER BY pv.entered_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_link_page_analytics(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_viewer_page_analytics(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_document_page_analytics(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_session_page_flow(text, uuid) TO authenticated, anon;

-- Add comment explaining the schema
COMMENT ON TABLE public.page_views IS 'Tracks time spent on each page of a document by viewers. Used for detailed analytics.';
COMMENT ON COLUMN public.page_views.time_spent_seconds IS 'Total time in seconds that the viewer spent on this specific page';
COMMENT ON COLUMN public.page_views.session_id IS 'Browser-generated session ID to track a single viewing session';
