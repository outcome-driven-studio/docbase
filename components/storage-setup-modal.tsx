"use client"

import { useState } from "react"
import { Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface StorageSetupModalProps {
  isOpen: boolean
  onSuccess: () => void
  onCancel: () => void
}

const sciFiNames = [
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

export function StorageSetupModal({
  isOpen,
  onSuccess,
  onCancel,
}: StorageSetupModalProps) {
  const [bucketName, setBucketName] = useState(
    sciFiNames[Math.floor(Math.random() * sciFiNames.length)]
  )
  const [isCreating, setIsCreating] = useState(false)

  async function createBucket() {
    setIsCreating(true)
    try {
      const response = await fetch("/api/create-storage-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create storage")
      }

      toast({
        title: "Storage created!",
        description: `Your secure storage "${bucketName}" is ready`,
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create storage",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="size-5" />
            Set Up Secure Storage
          </DialogTitle>
          <DialogDescription>
            Before uploading documents, we need to create a secure storage
            location in your Supabase account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>What&apos;s happening:</strong> We&apos;ll create a
              storage bucket in your Supabase project. This is where your
              documents will be securely stored.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucket-name">Storage Name</Label>
            <Input
              id="bucket-name"
              value={bucketName}
              onChange={(e) =>
                setBucketName(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                )
              }
              placeholder="my-storage"
            />
            <p className="text-xs text-muted-foreground">
              A unique name for your storage. Can only contain lowercase
              letters, numbers, and hyphens.
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm">
              <strong>Settings:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Visibility: Public (for shareable links)</li>
              <li>• Size limit: 50MB per file</li>
              <li>• Encryption: Enabled by Supabase</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={createBucket} disabled={isCreating || !bucketName}>
            {isCreating ? "Creating..." : "Create Storage"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
