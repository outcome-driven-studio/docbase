-- Add delete_link RPC function

CREATE OR REPLACE FUNCTION public.delete_link(
  link_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete the link only if it belongs to the user
  DELETE FROM public.links
  WHERE id = link_id AND created_by = user_id;
END;
$$;

