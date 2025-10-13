"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

const sciFiNames = [
  "Serenity Station",
  "Millennium Base",
  "Nexus Prime",
  "Starlight Command",
  "Phoenix Initiative",
  "Horizon Outpost",
  "Nova Syndicate",
  "Eclipse Division",
  "Odyssey Hub",
  "Enterprise Workspace",
  "Atlantis Project",
  "Prometheus Lab",
  "Andromeda Group",
  "Hyperion Sector",
  "Nebula Collective",
]

const storageBucketNames = [
  "nexus-vault",
  "phoenix-archive",
  "nebula-storage",
  "starlight-depot",
  "horizon-cache",
  "odyssey-vault",
  "atlantis-archive",
  "prometheus-storage",
  "andromeda-depot",
  "hyperion-vault",
]

export function CreateWorkspace({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [workspaceName, setWorkspaceName] = useState(
    sciFiNames[Math.floor(Math.random() * sciFiNames.length)]
  )
  const [storageName, setStorageName] = useState(
    storageBucketNames[Math.floor(Math.random() * storageBucketNames.length)]
  )
  const [isCreating, setIsCreating] = useState(false)

  async function createWorkspace() {
    setIsCreating(true)
    try {
      // Create workspace
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: workspaceName,
          created_by: userId,
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Add user as owner
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceData.id,
          user_id: userId,
          role: "owner",
          invited_by: userId,
        })

      if (memberError) throw memberError

      // Create storage bucket
      const bucketResponse = await fetch("/api/create-storage-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: storageName }),
      })

      const bucketResult = await bucketResponse.json()

      if (!bucketResult.success) {
        console.warn("Storage bucket creation failed:", bucketResult.error)
        // Don't fail workspace creation if bucket fails
        toast({
          title: "Workspace created",
          description: `${workspaceName} created. Note: You may need to create storage bucket "${storageName}" manually.`,
        })
      } else {
        toast({
          title: "Workspace created!",
          description: `${workspaceName} is ready with storage`,
        })
      }

      router.push("/links")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create workspace",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-5" />
          New Workspace
        </CardTitle>
        <CardDescription>
          Create a workspace for your team to collaborate on documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="My Team Workspace"
          />
          <p className="text-sm text-muted-foreground">
            A unique name for your workspace. You can change this later.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="storage-name">Storage Bucket Name</Label>
          <Input
            id="storage-name"
            value={storageName}
            onChange={(e) =>
              setStorageName(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
              )
            }
            placeholder="my-storage"
          />
          <p className="text-sm text-muted-foreground">
            Unique storage name for this workspace (lowercase, numbers, hyphens
            only). This will store all documents for this workspace.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium">Storage Settings</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Visibility: Public (for shareable links)</li>
            <li>• File size limit: 50MB per document</li>
            <li>• Encryption: Enabled by Supabase</li>
            <li>• Region: Auto-selected based on your project</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={createWorkspace}
            disabled={isCreating || !workspaceName || !storageName}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
