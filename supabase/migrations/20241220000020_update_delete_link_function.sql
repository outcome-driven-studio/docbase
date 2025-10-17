-- Update delete_link function to handle signature documents and cascade deletes

CREATE OR REPLACE FUNCTION public.delete_link(
  link_id_param uuid,
  user_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  link_record RECORD;
  signature_count INTEGER;
BEGIN
  -- Get the link and check ownership
  SELECT * INTO link_record
  FROM public.links
  WHERE id = link_id_param AND created_by = user_id_param;

  -- Check if link exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link not found or you do not have permission to delete it';
  END IF;

  -- If this is a signature-required document, check if it has any signatures
  IF link_record.require_signature = true THEN
    SELECT COUNT(*) INTO signature_count
    FROM public.signatures
    WHERE link_id = link_id_param;

    -- If any signatures exist, prevent deletion
    IF signature_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete a document that has been signed. Signed documents are legally binding and cannot be deleted.';
    END IF;
  END IF;

  -- Delete related records first (cascade should handle this, but being explicit)
  DELETE FROM public.viewers WHERE link_id = link_id_param;
  DELETE FROM public.signature_events WHERE link_id = link_id_param;
  DELETE FROM public.signatures WHERE link_id = link_id_param;

  -- Delete the link
  DELETE FROM public.links WHERE id = link_id_param AND created_by = user_id_param;
END;
$$;
