"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Check, ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

type Workspace = {
  id: string
  name: string
  role: string
  member_count: number
}

export function WorkspaceSelector() {
  const router = useRouter()
  const supabase = createClient()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchWorkspaces() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.rpc("get_user_workspaces", {
        user_id_arg: user.id,
      })

      if (error) throw error

      setWorkspaces(data || [])

      // Get current workspace from localStorage or use first one
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
      const current = savedWorkspaceId
        ? data?.find((w: Workspace) => w.id === savedWorkspaceId)
        : data?.[0]

      if (current) {
        setCurrentWorkspace(current)
        localStorage.setItem("currentWorkspaceId", current.id)
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error)
    } finally {
      setLoading(false)
    }
  }

  function switchWorkspace(workspace: Workspace) {
    setCurrentWorkspace(workspace)
    localStorage.setItem("currentWorkspaceId", workspace.id)
    toast({
      description: `Switched to ${workspace.name}`,
    })
    router.refresh()
  }

  if (loading) {
    return (
      <Button variant="ghost" disabled>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </Button>
    )
  }

  if (!currentWorkspace || workspaces.length === 0) {
    return (
      <Button
        variant="ghost"
        onClick={() => router.push("/workspaces/settings")}
      >
        <span className="text-sm">No Workspace</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <span className="max-w-[200px] truncate">
            {currentWorkspace.name}
          </span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace(workspace)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span>{workspace.name}</span>
              <span className="text-xs text-muted-foreground">
                {workspace.member_count} member
                {workspace.member_count !== 1 ? "s" : ""} · {workspace.role}
              </span>
            </div>
            {currentWorkspace.id === workspace.id && (
              <Check className="size-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/workspaces/new")}
          className="text-primary"
        >
          <Plus className="mr-2 size-4" />
          Create Workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/workspaces/settings")}>
          Workspace Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
