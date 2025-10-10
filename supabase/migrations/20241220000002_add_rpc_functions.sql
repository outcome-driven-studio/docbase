-- Create RPC functions needed by the application

-- Function to get user links with view counts
CREATE OR REPLACE FUNCTION public.get_user_links_with_views(id_arg uuid)
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
  views bigint
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
    COUNT(v.id)::bigint as views
  FROM public.links l
  LEFT JOIN public.viewers v ON l.id = v.link_id
  WHERE l.created_by = id_arg
  GROUP BY l.id, l.created_at, l.created_by, l.url, l.password, l.name, 
           l.updated_at, l.allow_download, l.send_notifications, l.require_email, 
           l.groups, l.expires, l.filename
  ORDER BY l.created_at DESC;
END;
$$;

-- Function to get a single link by ID
CREATE OR REPLACE FUNCTION public.get_link_by_id(link_id uuid)
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
  filename text
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
    l.filename
  FROM public.links l
  WHERE l.id = link_id;
END;
$$;

-- Function to update a link (used in link-form.tsx)
CREATE OR REPLACE FUNCTION public.update_link(
  link_id uuid,
  user_id uuid,
  url_arg text,
  password_arg text,
  expires_arg timestamp with time zone,
  filename_arg text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.links
  SET 
    url = url_arg,
    password = password_arg,
    expires = expires_arg,
    filename = filename_arg,
    updated_at = now()
  WHERE id = link_id AND created_by = user_id;
END;
$$;

-- Function to check if a user exists (used in login)
CREATE OR REPLACE FUNCTION public.checkIfUser(given_mail text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = given_mail
  );
END;
$$;

-- Function to select a link with creator name (used in view page)
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
  creator_name text
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
    u.name as creator_name
  FROM public.links l
  LEFT JOIN public.users u ON l.created_by = u.id
  WHERE l.id = link_id;
END;
$$;

