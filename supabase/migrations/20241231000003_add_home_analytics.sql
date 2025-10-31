-- Migration to add home page analytics functions

-- Function to get aggregated stats for home page
CREATE OR REPLACE FUNCTION public.get_user_home_analytics(user_id_arg uuid)
RETURNS TABLE (
    total_documents bigint,
    total_links bigint,
    total_views bigint,
    total_unique_viewers bigint,
    total_signatures bigint,
    recent_views jsonb,
    top_documents jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Count documents
        (SELECT COUNT(*) FROM public.documents WHERE created_by = user_id_arg)::bigint as total_documents,
        
        -- Count links
        (SELECT COUNT(*) FROM public.links WHERE created_by = user_id_arg)::bigint as total_links,
        
        -- Total views across all links
        (SELECT COUNT(*) FROM public.viewers v 
         INNER JOIN public.links l ON v.link_id = l.id 
         WHERE l.created_by = user_id_arg)::bigint as total_views,
        
        -- Unique viewers (distinct emails)
        (SELECT COUNT(DISTINCT v.email) FROM public.viewers v 
         INNER JOIN public.links l ON v.link_id = l.id 
         WHERE l.created_by = user_id_arg AND v.email IS NOT NULL)::bigint as total_unique_viewers,
        
        -- Total signatures
        (SELECT COUNT(*) FROM public.signatures s 
         INNER JOIN public.links l ON s.link_id = l.id 
         WHERE l.created_by = user_id_arg)::bigint as total_signatures,
        
        -- Recent views (last 10)
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'viewer_email', v.email,
                'viewed_at', v.viewed_at,
                'link_id', l.id,
                'document_filename', d.filename
            ) ORDER BY v.viewed_at DESC
        ), '[]'::jsonb)
         FROM (
             SELECT DISTINCT ON (v.id) v.email, v.viewed_at, l.id, d.filename
             FROM public.viewers v
             INNER JOIN public.links l ON v.link_id = l.id
             LEFT JOIN public.documents d ON l.document_id = d.id
             WHERE l.created_by = user_id_arg
             ORDER BY v.viewed_at DESC
             LIMIT 10
         ) v(email, viewed_at, id, filename)
        ) as recent_views,
        
        -- Top 5 documents by views
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'document_id', doc_stats.document_id,
                'document_filename', doc_stats.document_filename,
                'total_views', doc_stats.total_views,
                'unique_viewers', doc_stats.unique_viewers,
                'link_count', doc_stats.link_count
            ) ORDER BY doc_stats.total_views DESC
        ), '[]'::jsonb)
         FROM (
             SELECT 
                 d.id as document_id,
                 d.filename as document_filename,
                 COUNT(v.id)::bigint as total_views,
                 COUNT(DISTINCT v.email)::bigint as unique_viewers,
                 COUNT(DISTINCT l.id)::bigint as link_count
             FROM public.documents d
             LEFT JOIN public.links l ON l.document_id = d.id
             LEFT JOIN public.viewers v ON v.link_id = l.id
             WHERE d.created_by = user_id_arg
             GROUP BY d.id, d.filename
             ORDER BY total_views DESC
             LIMIT 5
         ) doc_stats
        ) as top_documents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get views over time for charting (last 30 days)
CREATE OR REPLACE FUNCTION public.get_user_views_timeline(user_id_arg uuid, days_arg integer DEFAULT 30)
RETURNS TABLE (
    view_date date,
    view_count bigint,
    unique_viewers bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(v.viewed_at) as view_date,
        COUNT(*)::bigint as view_count,
        COUNT(DISTINCT v.email)::bigint as unique_viewers
    FROM public.viewers v
    INNER JOIN public.links l ON v.link_id = l.id
    WHERE l.created_by = user_id_arg
    AND v.viewed_at >= NOW() - INTERVAL '1 day' * days_arg
    GROUP BY DATE(v.viewed_at)
    ORDER BY view_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_home_analytics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_views_timeline(uuid, integer) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Home Analytics Functions Created!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created: get_user_home_analytics()';
    RAISE NOTICE 'Created: get_user_views_timeline()';
    RAISE NOTICE '==============================================';
END $$;
