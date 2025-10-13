import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { WorkspaceSettings } from "@/components/workspace-settings"

export default async function WorkspaceSettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get current workspace from user's workspaces
  const { data: workspaces } = await supabase.rpc("get_user_workspaces", {
    user_id_arg: user.id,
  })

  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    redirect("/account")
  }

  // Get workspace members
  const { data: members } = await supabase
    .from("workspace_members")
    .select(
      `
      id,
      role,
      invited_at,
      accepted_at,
      user_id,
      users (
        id,
        name,
        email
      )
    `
    )
    .eq("workspace_id", currentWorkspace.id)
    .order("invited_at", { ascending: false })

  // Get pending invites
  const { data: invites } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", currentWorkspace.id)
    .eq("accepted", false)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Workspace Settings</h1>
      <WorkspaceSettings
        workspace={currentWorkspace}
        members={members || []}
        invites={invites || []}
        currentUserId={user.id}
      />
    </div>
  )
}
