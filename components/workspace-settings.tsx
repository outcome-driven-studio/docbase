"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Mail, Trash2, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { StorageStatusBadge } from "@/components/storage-status-badge"

type WorkspaceMember = {
  id: string
  role: string
  invited_at: string
  users:
    | {
        id: string
        name: string | null
        email: string | null
      }
    | {
        id: string
        name: string | null
        email: string | null
      }[]
}

type WorkspaceInvite = {
  id: string
  email: string
  role: string
  created_at: string
}

export function WorkspaceSettings({
  workspace,
  members,
  invites,
  currentUserId,
}: {
  workspace: { id: string; name: string; role: string }
  members: WorkspaceMember[]
  invites: WorkspaceInvite[]
  currentUserId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("member")
  const [isSending, setIsSending] = useState(false)

  const isAdmin = workspace.role === "owner" || workspace.role === "admin"

  async function sendInvite() {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Error",
        description: "Please enter email and select a role",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      // Insert invite
      const { error: inviteError } = await supabase
        .from("workspace_invites")
        .insert({
          workspace_id: workspace.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUserId,
        })

      if (inviteError) throw inviteError

      // TODO: Send invitation email via Resend

      toast({
        title: "Invitation sent",
        description: `Invite sent to ${inviteEmail}`,
      })

      setInviteEmail("")
      setInviteRole("member")
      setIsInviteDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  async function removeMember(memberId: string) {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error

      toast({
        description: "Member removed",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  async function cancelInvite(inviteId: string) {
    try {
      const { error } = await supabase
        .from("workspace_invites")
        .delete()
        .eq("id", inviteId)

      if (error) throw error

      toast({
        description: "Invitation cancelled",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>
            Manage your workspace settings and team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <p className="mt-1 text-lg">{workspace.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Your Role</label>
              <div className="mt-1">
                <Badge
                  variant={workspace.role === "owner" ? "default" : "secondary"}
                >
                  {workspace.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card id="storage">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Setup</CardTitle>
              <CardDescription>Configure storage for documents</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StorageStatusBadge />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.location.reload()}
              >
                Refresh Status
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Quick Setup (2 minutes)
            </p>
            <ol className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>1. Go to Supabase Dashboard → Storage</li>
              <li>2. Click &quot;New bucket&quot;</li>
              <li>
                3. Name:{" "}
                <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">
                  cube
                </code>
              </li>
              <li>
                4. Keep it <strong>Private</strong> 🔒 (More secure!)
              </li>
              <li>5. Click &quot;Create bucket&quot;</li>
              <li>
                6. Click &quot;Copy Policies SQL&quot; below and run in SQL
                Editor
              </li>
            </ol>
          </div>

          {/* Bucket Settings */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Bucket Configuration</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Bucket name</p>
                <p className="font-mono font-medium">cube</p>
              </div>
              <div>
                <p className="text-muted-foreground">Visibility</p>
                <p className="font-medium">Private 🔒</p>
              </div>
              <div>
                <p className="text-muted-foreground">File limit</p>
                <p className="font-medium">50MB per file</p>
              </div>
              <div>
                <p className="text-muted-foreground">Encryption</p>
                <p className="font-medium">Enabled</p>
              </div>
            </div>
          </div>

          {/* Policies with Copy Button - REQUIRED */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">
                Storage Policies{" "}
                <span className="text-destructive">*Required</span>
              </p>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  const policies = `-- Storage policies for 'cube' bucket (REQUIRED)
-- Run in: Supabase Dashboard → SQL Editor

-- Allow authenticated users to upload
CREATE POLICY "Users can upload to cube" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cube' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Users can update in cube" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cube' AND auth.role() = 'authenticated');

-- Allow authenticated users to read (via signed URLs)
CREATE POLICY "Users can read from cube" ON storage.objects
  FOR SELECT USING (bucket_id = 'cube' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete from cube" ON storage.objects
  FOR DELETE USING (bucket_id = 'cube' AND auth.role() = 'authenticated');`
                  navigator.clipboard.writeText(policies)
                  toast({
                    title: "Policies copied!",
                    description: "Paste in Supabase SQL Editor and run",
                  })
                }}
              >
                📋 Copy Policies SQL
              </Button>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Important: You must run these policies!
              </p>
              <p className="mt-1 text-xs text-red-800 dark:text-red-200">
                Click &quot;Copy Policies SQL&quot; above, then paste and run in
                Supabase Dashboard → SQL Editor. Without policies, uploads will
                fail even if the bucket exists.
              </p>
            </div>
          </div>

          {/* Security Explanation */}
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-3 dark:bg-green-950">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              🔒 Secure by Design
            </p>
            <p className="mt-1 text-xs text-green-800 dark:text-green-200">
              Your bucket is <strong>private</strong>. Documents are accessed
              via signed URLs with expiration - just like DocSend. Only people
              with the link can view, and you control access with passwords and
              expiration dates.
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>One-time setup:</strong> Once the bucket is created,
              storage works automatically. You don&apos;t need to manage it
              again.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} in this
                workspace
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 size-4" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const userData = Array.isArray(member.users)
                  ? member.users[0]
                  : member.users
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {userData?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{userData?.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.invited_at).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {member.role !== "owner" &&
                          userData?.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invites.length} pending invitation
              {invites.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvite(invite.id)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    Admin - Can manage members and all links
                  </SelectItem>
                  <SelectItem value="member">
                    Member - Can create and manage own links
                  </SelectItem>
                  <SelectItem value="viewer">
                    Viewer - Can view workspace links only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={sendInvite} disabled={isSending}>
              {isSending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
