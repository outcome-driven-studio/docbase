-- Fix infinite recursion in workspace_members policies

-- Drop old problematic policies
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Creators can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Creators can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Creators can remove members" ON public.workspace_members;

-- Drop old invite policies
DROP POLICY IF EXISTS "Users can view workspace invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Admins can update invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Creators can view workspace invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Creators can create invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Creators can update invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Creators can delete invites" ON public.workspace_invites;

-- Create new non-recursive policies for workspace_members

-- Users can view members of their own workspaces
CREATE POLICY "View workspace members" ON public.workspace_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can add members
CREATE POLICY "Add workspace members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can update members
CREATE POLICY "Update workspace members" ON public.workspace_members
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can remove members (except themselves)
CREATE POLICY "Remove workspace members" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
    AND user_id != auth.uid()
  );

-- Create new non-recursive policies for workspace_invites

-- Workspace creators can view invites
CREATE POLICY "View workspace invites" ON public.workspace_invites
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can create invites
CREATE POLICY "Create workspace invites" ON public.workspace_invites
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can update invites
CREATE POLICY "Update workspace invites" ON public.workspace_invites
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

-- Workspace creators can delete invites
CREATE POLICY "Delete workspace invites" ON public.workspace_invites
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
  );

