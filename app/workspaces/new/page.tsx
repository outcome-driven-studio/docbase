import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { CreateWorkspace } from "@/components/create-workspace"

export default async function NewWorkspacePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create New Workspace</h1>
      <CreateWorkspace userId={user.id} />
    </div>
  )
}
