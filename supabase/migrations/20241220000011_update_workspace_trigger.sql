-- Update workspace creation trigger with sci-fi names

-- Drop old function
DROP FUNCTION IF EXISTS public.create_personal_workspace CASCADE;

-- Create new function with sci-fi workspace names
CREATE OR REPLACE FUNCTION public.create_personal_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_workspace_id uuid;
  sci_fi_names text[] := ARRAY[
    'Serenity Station',
    'Millennium Base', 
    'Nexus Prime',
    'Starlight Command',
    'Phoenix Initiative',
    'Horizon Outpost',
    'Nova Syndicate',
    'Eclipse Division',
    'Odyssey Hub',
    'Enterprise Workspace',
    'Atlantis Project',
    'Prometheus Lab',
    'Andromeda Group',
    'Hyperion Sector',
    'Nebula Collective'
  ];
  random_name text;
BEGIN
  -- Pick a random sci-fi name
  random_name := sci_fi_names[floor(random() * array_length(sci_fi_names, 1) + 1)];
  
  -- Create workspace with sci-fi name
  INSERT INTO public.workspaces (name, created_by)
  VALUES (random_name, NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (new_workspace_id, NEW.id, 'owner', NEW.id);
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_user_created_workspace ON public.users;

CREATE TRIGGER on_user_created_workspace
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_workspace();

-- Create workspaces for any existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  sci_fi_names text[] := ARRAY[
    'Serenity Station',
    'Millennium Base', 
    'Nexus Prime',
    'Starlight Command',
    'Phoenix Initiative',
    'Horizon Outpost',
    'Nova Syndicate',
    'Eclipse Division',
    'Odyssey Hub',
    'Enterprise Workspace',
    'Atlantis Project',
    'Prometheus Lab',
    'Andromeda Group',
    'Hyperion Sector',
    'Nebula Collective'
  ];
  random_name text;
  new_ws_id uuid;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM workspace_members wm WHERE wm.user_id = u.id
    )
  LOOP
    -- Pick random sci-fi name
    random_name := sci_fi_names[floor(random() * array_length(sci_fi_names, 1) + 1)];
    
    -- Create workspace
    INSERT INTO workspaces (name, created_by)
    VALUES (random_name, user_record.id)
    RETURNING id INTO new_ws_id;
    
    -- Add as owner
    INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (new_ws_id, user_record.id, 'owner', user_record.id);
    
    RAISE NOTICE 'Created workspace % for user %', random_name, user_record.email;
  END LOOP;
END $$;

