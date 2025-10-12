-- Create RPC function to get analytics for a specific link

CREATE OR REPLACE FUNCTION public.get_link_analytics(link_id_arg uuid)
RETURNS TABLE (
  all_viewers bigint,
  unique_viewers bigint,
  all_views json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(v.id)::bigint as all_viewers,
    COUNT(DISTINCT v.email)::bigint as unique_viewers,
    COALESCE(
      json_agg(
        json_build_object(
          'id', v.id,
          'email', v.email,
          'viewed_at', v.viewed_at
        )
        ORDER BY v.viewed_at DESC
      ) FILTER (WHERE v.id IS NOT NULL),
      '[]'::json
    ) as all_views
  FROM public.links l
  LEFT JOIN public.viewers v ON l.id = v.link_id
  WHERE l.id = link_id_arg
  GROUP BY l.id;
END;
$$;

