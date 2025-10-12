"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { selectStyles } from "@/utils/select-styles"
import { createClient } from "@/utils/supabase/client"
import { X } from "lucide-react"
import CreatableSelect from "react-select/creatable"

import { Database } from "@/types/supabase"

import { Icons } from "./icons"
import { StyledQuillEditor } from "./quill-editor"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "./ui/use-toast"
import "react-quill/dist/quill.snow.css"
import "@/styles/quill-custom.css"
import { isValidEmail } from "@/utils/validation"

import { clientLogger } from "@/lib/client-logger"

type Group = { value: string; label: string; color: string }
type Contact = Database["public"]["Tables"]["contacts"]["Row"] & {
  groups: Group[]
}
type User = Database["public"]["Tables"]["users"]["Row"]
type Domain = Database["public"]["Tables"]["domains"]["Row"]

// Update the Recipient type
type Recipient = Group | { value: string; label: string; isEmail: true }

interface NewMessageProps {
  selectedContactEmail: string
  groups: Group[]
  contacts: Contact[]
  account: User
  domain: Domain | null
  onClose: () => void
}

export function MessageForm({
  selectedContactEmail,
  groups,
  contacts,
  account,
  domain,
  onClose,
}: NewMessageProps) {
  const supabase = createClient()
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([])
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])

  // Pre-populate recipient when selectedContactEmail is provided
  useEffect(() => {
    if (selectedContactEmail && contacts) {
      const contact = contacts.find((c) => c.email === selectedContactEmail)
      if (contact) {
        setRecipients([
          {
            value: contact.email,
            label: contact.name || contact.email,
            isEmail: true,
          },
        ])
      }
    }
  }, [selectedContactEmail, contacts])

  const customComponents = {
    MultiValue: ({ children, removeProps, ...props }: any) => {
      const isEmail = "isEmail" in props.data && props.data.isEmail
      return (
        <Badge
          className="m-1 flex items-center gap-1"
          style={{
            backgroundColor: isEmail ? "gray" : props.data.color,
            color: "white",
          }}
        >
          {children}
          <span {...removeProps} className="cursor-pointer hover:opacity-75">
            <X size={14} />
          </span>
        </Badge>
      )
    },
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault()
      subjectInputRef.current?.focus()
    }
  }

  const handleRecipientChange = (newValue: any, actionMeta: any) => {
    if (actionMeta.action === "create-option") {
      const newOption = newValue[newValue.length - 1]
      if (isValidEmail(newOption.value)) {
        setRecipients([
          ...newValue.slice(0, -1),
          { ...newOption, isEmail: true },
        ])
      } else {
        // Optionally, show an error message for invalid email
        toast({
          variant: "destructive",
          description: `Invalid email address: ${newOption.value}`,
        })
        setRecipients(newValue.slice(0, -1))
      }
    } else {
      setRecipients(newValue)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      if (!domain) {
        throw new Error("Failed to fetch domain information")
      }

      const emailRecipients = recipients
        .filter(
          (r): r is { value: string; label: string; isEmail: true } =>
            "isEmail" in r && r.isEmail
        )
        .map((r) => r.value)
      const groupRecipients = recipients.filter(
        (r): r is Group => !("isEmail" in r)
      ) as Group[]

      const selectedContactEmails = contacts
        .filter((contact) =>
          contact.groups.some((contactGroup) =>
            groupRecipients.some((sg) => sg.value === contactGroup.value)
          )
        )
        .map((contact) => contact.email)

      const to = Array.from(
        new Set([...emailRecipients, ...selectedContactEmails])
      )
        .map((email) => {
          const contact = contacts.find((c) => c.email === email)
          if (contact?.name) {
            return `${contact.name} <${email}>`
          } else {
            // Extract the part before @ as the name if no contact name is available
            const name = email.split("@")[0]
            return `${name} <${email}>`
          }
        })
        .slice(0, 50)

      // Validate that we have recipients
      if (to.length === 0) {
        throw new Error("Please select at least one recipient")
      }

      // Validate subject and body
      if (!subject.trim()) {
        throw new Error("Please enter a subject")
      }

      if (!body.trim()) {
        throw new Error("Please enter a message")
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          emailBody: body,
          domainName: domain.domain_name,
          senderName: domain.sender_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        clientLogger.error("Error response", { errorData })
        throw new Error(errorData.error || "Failed to send email")
      }

      // Add message to the database
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          created_by: account.id,
          from: `${domain.sender_name} <noreply@${domain.domain_name}>`,
          to: Array.isArray(to) ? to.join(", ") : to,
          subject,
          message: body,
        })
        .select()

      if (messageError) {
        clientLogger.error("Error inserting message into database", {
          messageError,
        })
        throw new Error("Failed to save message in database")
      }

      if (!messageData || messageData.length === 0) {
        throw new Error("No data returned after inserting message")
      }

      // Message saved successfully - no need to update user array
      // Messages can be queried by created_by field

      toast({
        description: "Your message has been sent",
      })

      onClose()
    } catch (error) {
      clientLogger.error("Error sending email", { error })
      toast({
        variant: "destructive",
        description: `Failed to send email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      })
    } finally {
      setIsSendingEmail(false)
      router.refresh()
    }
  }

  return (
    <div className="flex grow flex-col gap-2">
      {!selectedContactEmail && (
        <div className="space-y-2">
          <Label>To</Label>
          <CreatableSelect
            isMulti
            options={groups}
            value={recipients}
            onChange={handleRecipientChange}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Enter email addresses or select groups..."
            styles={selectStyles}
            components={customComponents}
            onKeyDown={handleKeyDown}
            createOptionPosition="first"
            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          ref={subjectInputRef}
        />
      </div>
      <div className="grow space-y-2">
        <Label>Body</Label>
        <StyledQuillEditor
          value={body}
          onChange={setBody}
          placeholder="Compose your email..."
        />
      </div>
      <div>
        <Button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className="w-full"
        >
          {isSendingEmail ? (
            <Icons.spinner className="size-4 animate-spin" />
          ) : (
            "Send Email"
          )}
        </Button>
      </div>
    </div>
  )
}
