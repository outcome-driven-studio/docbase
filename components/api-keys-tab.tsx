"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Copy, Eye, EyeOff, Key, Plus, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import * as bcrypt from "bcryptjs"
import { format } from "date-fns"

import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type User = Database["public"]["Tables"]["users"]["Row"]
type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"]

export default function ApiKeysTab({ account }: { account: User | null }) {
  const supabase = createClient()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (account) {
      loadApiKeys()
    }
  }, [account])

  async function loadApiKeys() {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", account!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      console.error("Error loading API keys:", error)
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createApiKey() {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Generate a random API key (vbd_ prefix + random UUID without hyphens)
      const rawKey = `vbd_${uuidv4().replace(/-/g, "")}`
      const keyHash = bcrypt.hashSync(rawKey, 10)
      const keyPrefix = rawKey.substring(0, 12) // vbd_12345678

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: account!.id,
          name: newKeyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setNewlyCreatedKey(rawKey)
      setShowNewKeyDialog(true)
      setNewKeyName("")
      await loadApiKeys()

      toast({
        title: "Success",
        description: "API key created successfully",
      })
    } catch (error) {
      console.error("Error creating API key:", error)
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function deleteApiKey(keyId: string) {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId)
        .eq("user_id", account!.id)

      if (error) throw error

      await loadApiKeys()
      toast({
        title: "Success",
        description: "API key deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      })
    } finally {
      setDeleteKeyId(null)
    }
  }

  async function toggleKeyStatus(keyId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: !currentStatus })
        .eq("id", keyId)
        .eq("user_id", account!.id)

      if (error) throw error

      await loadApiKeys()
      toast({
        title: "Success",
        description: `API key ${!currentStatus ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("Error toggling API key status:", error)
      toast({
        title: "Error",
        description: "Failed to update API key status",
        variant: "destructive",
      })
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  function toggleKeyVisibility(keyId: string) {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  if (!account) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Create and manage API keys to programmatically create links at scale.
            Use these keys to integrate VibeDocs with your email sequences, automation tools, and custom workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New API Key */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createApiKey()
                  }
                }}
              />
            </div>
            <Button onClick={createApiKey} disabled={isCreating}>
              <Plus className="mr-2 size-4" />
              {isCreating ? "Creating..." : "Create API Key"}
            </Button>
          </div>

          {/* API Keys List */}
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Key className="mx-auto mb-2 size-12 opacity-50" />
              <p>No API keys yet. Create your first key to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id} className={!key.is_active ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{key.name}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              key.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                            }`}
                          >
                            {key.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 font-mono text-sm">
                          <code className="rounded bg-muted px-2 py-1">
                            {visibleKeys.has(key.id) ? key.key_prefix + "..." : key.key_prefix + "••••••••••••••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.key_prefix)}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <p>Created: {format(new Date(key.created_at), "PPp")}</p>
                          {key.last_used_at && (
                            <p>Last used: {format(new Date(key.last_used_at), "PPp")}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyStatus(key.id, key.is_active)}
                        >
                          {key.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteKeyId(key.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Use your API key to create links programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">Authentication</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              Include your API key in the Authorization header:
            </p>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Create a Link</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              POST /api/v1/links
            </p>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              <code>{`{
  "filename": "Q4 Pitch Deck.pdf",
  "fileUrl": "https://your-storage.com/file.pdf",
  "password": "optional-password",
  "expires": "2025-12-31T23:59:59Z",
  "allowDownload": true,
  "requireEmail": true,
  "viewerPageHeading": "Q4 2024 Pitch Deck",
  "folderId": "optional-folder-uuid"
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">List Your Links</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              GET /api/v1/links?folderId=optional&limit=50&offset=0
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Manage Folders</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              GET /api/v1/folders - List folders
            </p>
            <p className="mb-2 text-sm text-muted-foreground">
              POST /api/v1/folders - Create folder
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created!</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ Save this key somewhere safe. It will only be shown once.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted p-3 font-mono text-sm">
                {newlyCreatedKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => newlyCreatedKey && copyToClipboard(newlyCreatedKey)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={(open) => !open && setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any applications using this API key will no longer be able to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteApiKey(deleteKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
