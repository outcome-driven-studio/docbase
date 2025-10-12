"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { isTyping } from "@/utils/is-typing"
import { createClient } from "@/utils/supabase/client"
import { Mail, Plus, X } from "lucide-react"

import { Database } from "@/types/supabase"
import { clientLogger } from "@/lib/client-logger"
import { useDomainCheck } from "@/hooks/use-domain-check"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { MessageForm } from "./message-form"
import { SafeHtml } from "./safe-html"
import { Button } from "./ui/button"
import { toast } from "./ui/use-toast"

type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  to?: string // Override: actual column name in DB
  message?: string // Override: actual column name in DB
}
type Contact = Database["public"]["Tables"]["contacts"]["Row"] & {
  groups: Group[]
}
type User = Database["public"]["Tables"]["users"]["Row"]
type Domain = Database["public"]["Tables"]["domains"]["Row"]
type Group = { value: string; label: string; color: string }

export function MessagesTable({
  messages,
  groups,
  contacts,
  account,
  domain,
}: {
  messages: Message[]
  groups: Group[]
  contacts: Contact[]
  account: User
  domain: Domain | null
}) {
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const checkDomain = useDomainCheck(domain)
  const supabase = createClient()
  const router = useRouter()

  const formatRecipients = (recipients: string | null | undefined) => {
    if (!recipients) return "No recipients"
    const emailToContact = new Map(
      contacts.map((contact) => [contact.email, contact])
    )
    return recipients
      .split(", ")
      .map((recipient) => {
        const email = recipient.match(/<(.+)>/)?.[1] || recipient
        const contact = emailToContact.get(email)
        if (contact) {
          return (
            <Link
              key={contact.id}
              href={`/contacts?contactId=${contact.id}`}
              onClick={(e) => {
                e.preventDefault()
                router.push(`/contacts?contactId=${contact.id}`)
              }}
              className="cursor-pointer hover:underline"
            >
              {contact.name}
            </Link>
          )
        }
        return recipient.split(" <")[0]
      })
      .reduce((prev, curr, i) => {
        return i === 0 ? [curr] : [...prev, ", ", curr]
      }, [] as React.ReactNode[])
  }

  const handleNewMessage = () => {
    checkDomain(() => setIsNewMessageDialogOpen(true))
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)

    if (error) {
      clientLogger.error("Error deleting message", { error })
      toast({
        variant: "destructive",
        title: "Failed to delete message",
        description: error.message,
      })
    } else {
      toast({
        description: "Message deleted successfully",
      })
      // Reset selection after successful deletion
      setSelectedMessage(null)
      setSelectedIndex(null)
      router.refresh()
    }
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedMessage) {
        setSelectedMessage(null)
        setSelectedIndex(null)
      } else if (event.key === "p" && hoveredMessageId) {
        const index = messages.findIndex((m) => m.id === hoveredMessageId)
        if (index !== -1) {
          setSelectedMessage(messages[index])
          setSelectedIndex(index)
        }
      } else if (selectedMessage) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault() // Prevent default scrolling
          setSelectedIndex((prevIndex) => {
            if (prevIndex === null) return 0
            const newIndex =
              event.key === "ArrowDown"
                ? (prevIndex + 1) % messages.length
                : (prevIndex - 1 + messages.length) % messages.length
            return newIndex
          })
        }
      }
      if (event.key === "d" && hoveredMessageId) {
        event.preventDefault()
        setMessageToDelete(hoveredMessageId)
        setIsDeleteDialogOpen(true)
      }
    },
    [selectedMessage, hoveredMessageId, messages]
  )

  useEffect(() => {
    if (
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < messages.length
    ) {
      setSelectedMessage(messages[selectedIndex])
      // Scroll the selected message into view
      const messageElement = document.getElementById(
        `message-${messages[selectedIndex].id}`
      )
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    } else {
      // Reset selection if the index is invalid
      setSelectedMessage(null)
      setSelectedIndex(null)
    }
  }, [selectedIndex, messages])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && !isTyping()) {
        e.preventDefault()
        checkDomain(() => setIsNewMessageDialogOpen(true))
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [checkDomain])

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`flex flex-col max-w-3xl mx-auto ${
          selectedMessage ? "w-1/2 border-r" : "w-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b p-4 pt-10">
          {selectedMessage ? (
            <h1 className="text-2xl font-semibold">Messages</h1>
          ) : (
            <>
              <div className="w-[150px]"></div>
              <h1 className="grow text-center text-2xl font-semibold">
                Messages
              </h1>
            </>
          )}
          <Button
            variant="ghost"
            className="w-[150px]"
            onClick={handleNewMessage}
          >
            <Plus className="size-4" />
            <span className="ml-2 hidden sm:inline-block">New</span>
          </Button>
        </div>
        <div className="grow overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="mb-4 size-16 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">
                No messages yet
              </p>
              <p className="text-sm text-muted-foreground">
                Click &quot;New&quot; to send your first message
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`group relative cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedIndex === index
                      ? "border-primary bg-primary/5 shadow-md"
                      : "hover:border-primary/50 hover:shadow-sm"
                  }`}
                  onClick={() => {
                    setSelectedMessage(message)
                    setSelectedIndex(index)
                  }}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Badge */}
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Sent
                    </span>
                  </div>

                  {/* Subject */}
                  <h3 className="mb-2 line-clamp-1 pr-16 font-semibold text-foreground">
                    {message.subject}
                  </h3>

                  {/* Recipients */}
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {formatRecipients(message.to)}
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    <SafeHtml html={message.message || ""} />
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedMessage && (
        <div className="flex w-1/2 flex-col bg-muted/20">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b bg-background p-6">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {selectedMessage.subject}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sent on{" "}
                {new Date(selectedMessage.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>
            </div>
            <button
              onClick={() => setSelectedMessage(null)}
              className="rounded-full p-2 transition-colors hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="grow overflow-y-auto">
            {/* Recipients Section */}
            <div className="border-b bg-background p-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="size-4" />
                <span>Recipients</span>
              </div>
              <div className="text-foreground">
                {formatRecipients(selectedMessage.to)}
              </div>
            </div>

            {/* Message Content */}
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <SafeHtml html={selectedMessage.message || ""} />
              </div>
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={isNewMessageDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsNewMessageDialogOpen(false)
          }
        }}
      >
        <DialogContent className="flex w-full max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Compose and send a new email to selected groups
            </DialogDescription>
          </DialogHeader>
          <MessageForm
            selectedContactEmail=""
            groups={groups}
            contacts={contacts}
            account={account}
            onClose={() => setIsNewMessageDialogOpen(false)}
            domain={domain}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the message. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (messageToDelete) {
                  deleteMessage(messageToDelete)
                  setMessageToDelete(null)
                }
                setIsDeleteDialogOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
