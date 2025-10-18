-- Update select_link RPC to include creator signature
DROP FUNCTION IF EXISTS public.select_link(uuid);

CREATE OR REPLACE FUNCTION public.select_link(link_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  created_by uuid,
  url text,
  password text,
  name text,
  updated_at timestamp with time zone,
  allow_download boolean,
  send_notifications boolean,
  require_email boolean,
  groups uuid[],
  expires timestamp with time zone,
  filename text,
  require_signature boolean,
  signature_instructions text,
  viewer_page_heading text,
  viewer_page_subheading text,
  viewer_page_cover_letter text,
  viewer_page_logo_url text,
  display_mode text,
  show_creator_signature boolean,
  creator_name text,
  creator_signature_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.created_at,
    l.created_by,
    l.url,
    l.password,
    l.name,
    l.updated_at,
    l.allow_download,
    l.send_notifications,
    l.require_email,
    l.groups,
    l.expires,
    l.filename,
    l.require_signature,
    l.signature_instructions,
    l.viewer_page_heading,
    l.viewer_page_subheading,
    l.viewer_page_cover_letter,
    l.viewer_page_logo_url,
    l.display_mode,
    l.show_creator_signature,
    u.name as creator_name,
    u.signature_url as creator_signature_url
  FROM public.links l
  LEFT JOIN public.users u ON l.created_by = u.id
  WHERE l.id = link_id;
END;
$$;
