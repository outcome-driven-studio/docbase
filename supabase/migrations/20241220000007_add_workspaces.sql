-- Add Team Workspaces Feature

-- Create workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid REFERENCES public.users(id),
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create workspace_invites table
CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  accepted boolean DEFAULT false,
  UNIQUE(workspace_id, email)
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Add workspace_id to links table
ALTER TABLE public.links ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to contacts table
ALTER TABLE public.contacts ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to groups table  
ALTER TABLE public.groups ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- RLS Policies for Workspaces

-- Users can view workspaces they're members of
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create their own workspaces
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Owners and admins can update workspaces
CREATE POLICY "Owners and admins can update workspaces" ON public.workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete workspaces
CREATE POLICY "Owners can delete workspaces" ON public.workspaces
  FOR DELETE USING (created_by = auth.uid());

-- Workspace Members Policies (simplified to avoid recursion)

-- Users can view members of workspaces they belong to
CREATE POLICY "Users can view workspace members" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid() OR workspace_id IN (
    SELECT w.id FROM public.workspaces w WHERE w.created_by = auth.uid()
  ));

-- Workspace creators can add members
CREATE POLICY "Creators can add members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Workspace creators can update members
CREATE POLICY "Creators can update members" ON public.workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Workspace creators can remove members (except themselves)
CREATE POLICY "Creators can remove members" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    ) AND user_id != auth.uid()
  );

-- Workspace Invites Policies (simplified to avoid recursion)

-- Workspace creators can view invites
CREATE POLICY "Creators can view workspace invites" ON public.workspace_invites
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Workspace creators can create invites
CREATE POLICY "Creators can create invites" ON public.workspace_invites
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Workspace creators can update invites
CREATE POLICY "Creators can update invites" ON public.workspace_invites
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Workspace creators can delete invites
CREATE POLICY "Creators can delete invites" ON public.workspace_invites
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Update Links RLS to be workspace-aware

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own links" ON public.links;
DROP POLICY IF EXISTS "Users can insert their own links" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- New workspace-aware policies
CREATE POLICY "Users can view workspace links" ON public.links
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    ) OR created_by = auth.uid()  -- Can also see own personal links
  );

CREATE POLICY "Members can create links" ON public.links
  FOR INSERT WITH CHECK (
    (workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )) OR (workspace_id IS NULL AND auth.uid() = created_by)  -- Personal links
  );

CREATE POLICY "Members can update links" ON public.links
  FOR UPDATE USING (
    (workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    ) AND created_by = auth.uid()) OR (workspace_id IS NULL AND created_by = auth.uid())
  );

CREATE POLICY "Members can delete links" ON public.links
  FOR DELETE USING (
    (workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )) OR (workspace_id IS NULL AND created_by = auth.uid())
  );

-- Function to create default personal workspace for new users
CREATE OR REPLACE FUNCTION public.create_personal_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create a personal workspace
  INSERT INTO public.workspaces (name, created_by)
  VALUES (NEW.email || '''s Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (new_workspace_id, NEW.id, 'owner', NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to create personal workspace on user creation
CREATE TRIGGER on_user_created_workspace
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_workspace();

-- Helper function to get user's workspaces
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_id_arg uuid)
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  member_count bigint,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    wm.role,
    COUNT(DISTINCT wm2.user_id)::bigint as member_count,
    w.created_at
  FROM public.workspaces w
  JOIN public.workspace_members wm ON w.id = wm.workspace_id
  LEFT JOIN public.workspace_members wm2 ON w.id = wm2.workspace_id
  WHERE wm.user_id = user_id_arg
  GROUP BY w.id, w.name, wm.role, w.created_at
  ORDER BY w.created_at DESC;
END;
$$;

