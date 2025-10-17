-- Update delete_link function to also delete storage files
-- This fixes the issue where deleting links left orphaned files in storage

DROP FUNCTION IF EXISTS public.delete_link(uuid, uuid);

CREATE FUNCTION public.delete_link(
  link_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_link_id ALIAS FOR link_id;
  v_user_id ALIAS FOR user_id;
  link_record RECORD;
  signature_count INTEGER;
BEGIN
  -- Get the link and check ownership
  SELECT * INTO link_record
  FROM public.links l
  WHERE l.id = v_link_id AND l.created_by = v_user_id;

  -- Check if link exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found or you do not have permission to delete it';
  END IF;

  -- If this is a signature-required document, check if it has any signatures
  IF link_record.require_signature = true THEN
    SELECT COUNT(*) INTO signature_count
    FROM public.signatures s
    WHERE s.link_id = v_link_id;

    -- If any signatures exist, prevent deletion
    IF signature_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete a document that has been signed. Signed documents are legally binding and cannot be deleted.';
    END IF;
  END IF;

  -- Delete the file from storage
  -- The storage path is the link ID itself (stored in the 'cube' bucket)
  PERFORM storage.delete_object('cube', v_link_id::text);

  -- Delete related records first (cascade should handle this, but being explicit)
  DELETE FROM public.viewers v WHERE v.link_id = v_link_id;
  DELETE FROM public.signature_events se WHERE se.link_id = v_link_id;
  DELETE FROM public.signatures s WHERE s.link_id = v_link_id;

  -- Delete the link
  DELETE FROM public.links l WHERE l.id = v_link_id AND l.created_by = v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_link(uuid, uuid) TO authenticated;
