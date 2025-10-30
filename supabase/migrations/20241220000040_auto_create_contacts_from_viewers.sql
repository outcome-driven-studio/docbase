-- Function to automatically create contacts from viewers
CREATE OR REPLACE FUNCTION public.create_contact_from_viewer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  link_creator_id uuid;
  link_workspace_id uuid;
BEGIN
  -- Get the link creator and workspace
  SELECT created_by, workspace_id INTO link_creator_id, link_workspace_id
  FROM public.links
  WHERE id = NEW.link_id;

  -- Only proceed if we have a creator
  IF link_creator_id IS NOT NULL AND NEW.email IS NOT NULL THEN
    -- Insert contact if it doesn't exist (ON CONFLICT DO NOTHING)
    INSERT INTO public.contacts (email, created_by, workspace_id, created_at, updated_at)
    VALUES (
      NEW.email,
      link_creator_id,
      link_workspace_id,
      NEW.viewed_at,
      NEW.viewed_at
    )
    ON CONFLICT (email, created_by) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to create contact when viewer is recorded
DROP TRIGGER IF EXISTS on_viewer_created_contact ON public.viewers;
CREATE TRIGGER on_viewer_created_contact
  AFTER INSERT ON public.viewers
  FOR EACH ROW
  EXECUTE FUNCTION create_contact_from_viewer();

-- Add comment
COMMENT ON FUNCTION public.create_contact_from_viewer() IS 'Automatically creates a contact entry when someone views a document link';
