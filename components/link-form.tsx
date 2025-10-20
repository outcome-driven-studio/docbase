"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import * as bcrypt from "bcryptjs"
import { format } from "date-fns"
import { CalendarIcon, Copy, ExternalLink, FileText, ImageIcon, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import { v4 as uuidv4 } from "uuid"
import * as z from "zod"

import { Database } from "@/types/supabase"
import { clientLogger } from "@/lib/client-logger"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Switch } from "./ui/switch"
import { toast } from "./ui/use-toast"

const linkFormSchema = z
  .object({
    protectWithPassword: z.boolean(),
    protectWithExpiration: z.boolean(),
    allowDownload: z.boolean(),
    requireEmail: z.boolean(),
    requireSignature: z.boolean(),
    showCreatorSignature: z.boolean(),
    password: z.string().optional(),
    expires: z.date().nullable(),
    filename: z.string().min(1, "Filename is required"),
    signatureInstructions: z.string().optional(),
    viewerPageHeading: z.string().optional(),
    viewerPageSubheading: z.string().optional(),
    viewerPageCoverLetter: z.string().optional(),
    coverLetterFont: z.enum(["cursive", "arial", "times", "georgia", "mono"]).default("cursive"),
    coverLetterColor: z.string().default("gray-800"),
    displayMode: z.enum(["auto", "slideshow", "document"]).default("auto"),
  })
  .refine(
    (data) => {
      if (
        data.protectWithPassword &&
        (!data.password || data.password.length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: "Password is required when protection is enabled",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.protectWithExpiration && !data.expires) {
        return false
      }
      return true
    },
    {
      message: "Expiration date is required when expiration is enabled",
      path: ["expires"],
    }
  )

type LinkFormValues = z.infer<typeof linkFormSchema>
type User = Database["public"]["Tables"]["users"]["Row"]
type Link = Database["public"]["Tables"]["links"]["Row"]

export default function LinkForm({
  link,
  account,
}: {
  link: Link | null
  account: User | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    link?.viewer_page_logo_url || null
  )
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [protectWithPassword, setProtectWithPassword] = useState<boolean>(
    !!link?.password
  )
  const [protectWithExpiration, setProtectWithExpiration] = useState<boolean>(
    !!link?.expires
  )
  const [allowDownload, setAllowDownload] = useState<boolean>(
    link?.allow_download !== false
  )
  const [requireEmail, setRequireEmail] = useState<boolean>(
    link?.require_email !== false // Default to true
  )
  const [requireSignature, setRequireSignature] = useState<boolean>(
    false // TODO: Get from link when we add the column
  )
  const [showCreatorSignature, setShowCreatorSignature] = useState<boolean>(
    link?.show_creator_signature || false
  )

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      protectWithPassword: !!link?.password,
      protectWithExpiration: !!link?.expires,
      allowDownload: link?.allow_download !== false,
      requireEmail: link?.require_email !== false, // Default to true
      requireSignature: link?.require_signature || false,
      showCreatorSignature: link?.show_creator_signature || false,
      password: link?.password ? "********" : "",
      expires: link?.expires ? new Date(link.expires) : null,
      filename: link?.filename || "",
      signatureInstructions: link?.signature_instructions || "",
      viewerPageHeading: link?.viewer_page_heading || "",
      viewerPageSubheading: link?.viewer_page_subheading || "",
      viewerPageCoverLetter: link?.viewer_page_cover_letter || "",
      coverLetterFont: (link?.cover_letter_font as "cursive" | "arial" | "times" | "georgia" | "mono") || "cursive",
      coverLetterColor: link?.cover_letter_color || "gray-800",
      displayMode: (link?.display_mode as "auto" | "slideshow" | "document") || "auto",
    },
  })
  const [expiresCalendarOpen, setExpiresCalendarOpen] = useState(false)

  function onSubmit(data: LinkFormValues) {
    if (data && (file || link)) {
      createLink({
        data,
        file,
      })
    } else {
      clientLogger.error("No file selected and no existing link")
    }
  }

  async function createUrl({
    filePath,
    expirationSeconds,
  }: {
    filePath: string
    expirationSeconds: number
  }) {
    const { data: signedUrlData } = await supabase.storage
      .from("cube")
      .createSignedUrl(filePath, expirationSeconds)

    return signedUrlData?.signedUrl
  }

  async function createLink({
    data,
    file,
  }: {
    data: LinkFormValues
    file: File | null
  }) {
    try {
      if (!account) {
        throw new Error("User account not found")
      }

      // Note: Storage bucket should be created manually in Supabase Dashboard
      // No need to check here - let upload fail with clear error if bucket missing

      let passwordHash = null

      if (data.protectWithPassword) {
        if (data.password && data.password !== "********") {
          passwordHash = bcrypt.hashSync(data.password, 10)
        } else if (link?.password) {
          passwordHash = link.password
        } else {
          throw new Error("Password is required when protection is enabled")
        }
      }

      const linkId = link ? link.id : uuidv4()
      const storageFilePath = `${linkId}`

      // Upload new file or use existing file path
      let filePathToUse = link ? link.id : storageFilePath

      if (file) {
        setIsUploading(true)

        const { error: uploadError } = await supabase.storage
          .from("cube")
          .upload(storageFilePath, file, { upsert: true })

        if (uploadError) {
          setIsUploading(false)
          throw uploadError
        }
        filePathToUse = storageFilePath
        setIsUploading(false)
      }

      // Upload logo if provided
      let logoUrl = link?.viewer_page_logo_url || null
      if (logoFile) {
        setIsUploading(true)
        const logoFileName = `${linkId}-logo-${Date.now()}`
        const { error: logoUploadError } = await supabase.storage
          .from("cube")
          .upload(logoFileName, logoFile, { upsert: true })

        if (logoUploadError) {
          setIsUploading(false)
          throw logoUploadError
        }

        // Create signed URL for the logo with same expiration as document
        const logoExpirationSeconds = data.protectWithExpiration && data.expires
          ? Math.floor((new Date(data.expires).getTime() - new Date().getTime()) / 1000)
          : 10 * 365 * 24 * 60 * 60 // 10 years if no expiration

        const { data: logoSignedData } = await supabase.storage
          .from("cube")
          .createSignedUrl(logoFileName, logoExpirationSeconds)

        logoUrl = logoSignedData?.signedUrl || null
        setIsUploading(false)
      }

      let expirationSeconds: number
      if (data.protectWithExpiration && data.expires) {
        const currentDate = new Date()
        const expirationDate = new Date(data.expires)
        expirationSeconds = Math.floor(
          (expirationDate.getTime() - currentDate.getTime()) / 1000
        )
      } else {
        // Set a long expiration time (e.g., 10 years) when expiration is toggled off
        expirationSeconds = 10 * 365 * 24 * 60 * 60 // 10 years in seconds
      }

      const signedUrl = await createUrl({
        filePath: filePathToUse,
        expirationSeconds,
      })

      let result
      if (link) {
        // Use RPC for updating
        result = await supabase.rpc("update_link", {
          link_id: link.id,
          user_id: account.id,
          url_arg: signedUrl,
          password_arg: passwordHash,
          expires_arg: data.protectWithExpiration
            ? data.expires?.toISOString()
            : null,
          filename_arg: data.filename,
        })
        // Update fields not in the RPC
        await supabase
          .from("links")
          .update({
            allow_download: data.allowDownload,
            require_email: data.requireEmail,
            viewer_page_heading: data.viewerPageHeading || null,
            viewer_page_subheading: data.viewerPageSubheading || null,
            viewer_page_cover_letter: data.viewerPageCoverLetter || null,
            viewer_page_logo_url: logoUrl,
            display_mode: data.displayMode,
            show_creator_signature: data.showCreatorSignature,
            cover_letter_font: data.coverLetterFont,
            cover_letter_color: data.coverLetterColor,
          })
          .eq("id", link.id)
      } else {
        // Insert new link
        result = await supabase.from("links").insert({
          id: linkId,
          url: signedUrl,
          password: passwordHash,
          expires: data.protectWithExpiration
            ? data.expires?.toISOString()
            : null,
          filename: data.filename,
          allow_download: data.allowDownload,
          require_email: data.requireEmail,
          require_signature: data.requireSignature,
          signature_instructions: data.signatureInstructions || null,
          viewer_page_heading: data.viewerPageHeading || null,
          viewer_page_subheading: data.viewerPageSubheading || null,
          viewer_page_cover_letter: data.viewerPageCoverLetter || null,
          viewer_page_logo_url: logoUrl,
          display_mode: data.displayMode,
          show_creator_signature: data.showCreatorSignature,
          cover_letter_font: data.coverLetterFont,
          cover_letter_color: data.coverLetterColor,
          created_by: account.id,
        })
      }

      if (result.error) throw result.error

      toast({
        description: link
          ? "Your link has been updated successfully"
          : "Your link has been created successfully",
      })
      router.push("/links")
      router.refresh()
    } catch (error: any) {
      clientLogger.error("Error saving link", { error })
      console.error("Full error details:", error)
      toast({
        description: error.message || "An error occurred while saving the link",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0]

      // Check file size (50MB limit)
      const maxSizeInBytes = 50 * 1024 * 1024 // 50MB
      if (droppedFile.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `Maximum file size is 50MB. Your file is ${(
            droppedFile.size /
            (1024 * 1024)
          ).toFixed(2)}MB`,
          variant: "destructive",
        })
        return
      }

      setFile(droppedFile)
      form.setValue("filename", droppedFile.name, { shouldDirty: true })
      toast({
        description: "File selected successfully",
      })
    }
  }

  const onLogoUpload = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0]

      // Check if it's an image
      if (!uploadedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Check file size (5MB limit for logos)
      const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
      if (uploadedFile.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `Maximum logo size is 5MB. Your file is ${(
            uploadedFile.size /
            (1024 * 1024)
          ).toFixed(2)}MB`,
          variant: "destructive",
        })
        return
      }

      setLogoFile(uploadedFile)
      // Create preview URL
      const previewUrl = URL.createObjectURL(uploadedFile)
      setLogoPreviewUrl(previewUrl)
      toast({
        description: "Logo uploaded successfully",
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  })

  const {
    getRootProps: getLogoRootProps,
    getInputProps: getLogoInputProps,
    isDragActive: isLogoDragActive,
  } = useDropzone({
    onDrop: onLogoUpload,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
    },
  })

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem className="flex flex-col rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="grow space-y-0.5">
                <FormLabel className="pr-2 text-base">
                  Password Protected
                </FormLabel>
                <FormDescription className="pr-4">
                  Viewers must enter this password to view your document
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={protectWithPassword}
                  onCheckedChange={(checked) => {
                    setProtectWithPassword(checked)
                    form.setValue("protectWithPassword", checked, { shouldDirty: true })
                    if (!checked) {
                      form.setValue("password", "")
                    }
                  }}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem
                className={cn(
                  "flex flex-col rounded-lg border p-4",
                  !protectWithPassword && "hidden"
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="grow space-y-0.5">
                    <FormLabel htmlFor="password" className="pr-2 text-base">
                      Password
                    </FormLabel>
                    <FormDescription className="pr-4">
                      {link?.password
                        ? "Enter a new password or leave blank to keep the existing one"
                        : "Enter a password to protect your document"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      className="w-[200px]"
                      {...field}
                      disabled={!protectWithPassword}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem className="flex flex-col rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="grow space-y-0.5">
                <FormLabel className="pr-2 text-base">
                  Set Expiration Date
                </FormLabel>
                <FormDescription className="pr-4">
                  Viewers will no longer be able to access your link after this
                  date
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={protectWithExpiration}
                  onCheckedChange={(checked) => {
                    setProtectWithExpiration(checked)
                    form.setValue("protectWithExpiration", checked, { shouldDirty: true })
                    if (!checked) {
                      form.setValue("expires", null)
                    } else if (!form.getValues("expires")) {
                      const defaultDate = new Date()
                      defaultDate.setDate(defaultDate.getDate() + 30)
                      defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0)
                      form.setValue("expires", defaultDate)
                    }
                  }}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
          {protectWithExpiration && (
            <FormField
              control={form.control}
              name="expires"
              render={({ field }) => (
                <FormItem className="flex flex-col rounded-lg border p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="grow space-y-0.5">
                      <FormLabel htmlFor="expires" className="pr-2 text-base">
                        Expires
                      </FormLabel>
                      <FormDescription className="pr-4">
                        Select the expiration date and time for this link
                      </FormDescription>
                    </div>
                    <Popover
                      open={expiresCalendarOpen}
                      onOpenChange={(open) => setExpiresCalendarOpen(open)}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="expires"
                            variant="outline"
                            className={cn(
                              "w-[200px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              <>
                                <span className="hidden sm:inline">
                                  {format(field.value, "PPP")}
                                </span>
                                <span className="sm:hidden">
                                  {format(field.value, "MM/dd/yy")}
                                </span>
                              </>
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(newDate) => {
                            if (newDate) {
                              const updatedDate = new Date(newDate)
                              updatedDate.setHours(
                                field.value ? field.value.getHours() : 0
                              )
                              updatedDate.setMinutes(
                                field.value ? field.value.getMinutes() : 0
                              )
                              updatedDate.setSeconds(0)
                              field.onChange(updatedDate)
                            }
                          }}
                          defaultMonth={field.value || new Date()}
                          disabled={(date) =>
                            date < new Date() || date > new Date("2900-01-01")
                          }
                          initialFocus
                        />
                        <div className="border-t border-border p-3">
                          <Input
                            type="time"
                            value={
                              field.value ? format(field.value, "HH:mm") : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":")
                              const newDate = new Date(
                                field.value || new Date()
                              )
                              newDate.setHours(
                                parseInt(hours),
                                parseInt(minutes)
                              )
                              field.onChange(newDate)
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {(file || link) && (
            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem className="flex flex-col rounded-lg border p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="grow space-y-0.5">
                      <FormLabel htmlFor="filename" className="pr-2 text-base">
                        Filename
                      </FormLabel>
                      <FormDescription className="pr-4">
                        Enter a name for your file
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input
                        id="filename"
                        className="w-[calc(60%-1rem)]"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormItem className="flex flex-col rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="grow space-y-0.5">
                <FormLabel className="pr-2 text-base">Allow Download</FormLabel>
                <FormDescription className="pr-4">
                  When disabled, viewers can only view the document in the
                  browser but cannot download it
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={allowDownload}
                  onCheckedChange={(checked) => {
                    setAllowDownload(checked)
                    form.setValue("allowDownload", checked, { shouldDirty: true })
                  }}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>

          <FormItem className="flex flex-col rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="grow space-y-0.5">
                <FormLabel className="pr-2 text-base">
                  Require Email 📧
                </FormLabel>
                <FormDescription className="pr-4">
                  When enabled, viewers must enter their email to view (no
                  authentication required). Perfect for collecting viewer data
                  for pitch decks and one-pagers.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={requireEmail}
                  onCheckedChange={(checked) => {
                    setRequireEmail(checked)
                    form.setValue("requireEmail", checked, { shouldDirty: true })
                  }}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>

          {/* Signature toggle - ONLY for new links (not edits) */}
          {!link && (
            <>
              <FormItem className="flex flex-col rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/50">
                <div className="flex flex-row items-center justify-between">
                  <div className="grow space-y-0.5">
                    <FormLabel className="pr-2 text-base">
                      Require Signature ✍️
                    </FormLabel>
                    <FormDescription className="pr-4">
                      Viewers must sign before accessing. Perfect for NDAs,
                      contracts, and legal agreements.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={requireSignature}
                      onCheckedChange={(checked) => {
                        setRequireSignature(checked)
                        form.setValue("requireSignature", checked, { shouldDirty: true })
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>

              {requireSignature && (
                <FormItem>
                  <FormLabel>Signature Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Please sign to confirm you agree to these terms"
                      value={form.watch("signatureInstructions") || ""}
                      onChange={(e) =>
                        form.setValue("signatureInstructions", e.target.value, { shouldDirty: true })
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Custom message shown when requesting signature
                  </FormDescription>
                </FormItem>
              )}
            </>
          )}

          {/* Viewer Page Customization Section */}
          <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-blue-50/30 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="mb-2">
              <h3 className="text-lg font-semibold">Customize Receiver Page</h3>
              <p className="text-sm text-muted-foreground">
                Personalize the page your recipients see when they view this
                document
              </p>
            </div>

            {/* Logo Upload */}
            <FormItem>
              <FormLabel>Logo (Optional)</FormLabel>
              <FormDescription>
                Upload a logo to personalize the viewer page and email entry
                screen
              </FormDescription>
              <div className="space-y-3">
                {logoPreviewUrl && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreviewUrl}
                      alt="Logo preview"
                      className="h-20 w-auto rounded-md border border-gray-300 object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -right-2 -top-2 size-6 rounded-full p-0"
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreviewUrl(null)
                        toast({
                          description: "Logo removed",
                        })
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                )}
                <div
                  {...getLogoRootProps()}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-blue-400",
                    isLogoDragActive && "border-blue-500 bg-blue-50",
                    isUploading && "pointer-events-none opacity-50"
                  )}
                >
                  <input {...getLogoInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isLogoDragActive
                        ? "Drop your logo here"
                        : logoPreviewUrl
                        ? "Click or drag to replace logo"
                        : "Click or drag to upload logo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="viewerPageHeading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Heading</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Q4 2024 Pitch Deck"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Main title shown at the top of the viewer page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="viewerPageSubheading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Subheading</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Series A Fundraising"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Secondary text shown below the heading
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="viewerPageCoverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Thank you for taking the time to review our deck. We're excited to share our vision with you..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal note for investors, customers, or recipients
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Font and Color selectors - only show if cover letter has content */}
            {form.watch("viewerPageCoverLetter") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coverLetterFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Letter Font</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue("coverLetterFont", value as "cursive" | "arial" | "times" | "georgia" | "mono", { shouldDirty: true })
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cursive">Cursive (Handwritten)</SelectItem>
                          <SelectItem value="arial">Arial (Sans-serif)</SelectItem>
                          <SelectItem value="times">Times New Roman</SelectItem>
                          <SelectItem value="georgia">Georgia (Serif)</SelectItem>
                          <SelectItem value="mono">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Font style for the cover letter
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverLetterColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Color</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          console.log("Color changed to:", value)
                          field.onChange(value)
                          form.setValue("coverLetterColor", value, { shouldDirty: true })
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gray-800">Dark Gray</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="blue-600">Blue</SelectItem>
                          <SelectItem value="indigo-600">Indigo</SelectItem>
                          <SelectItem value="purple-600">Purple</SelectItem>
                          <SelectItem value="green-600">Green</SelectItem>
                          <SelectItem value="red-600">Red</SelectItem>
                          <SelectItem value="amber-700">Amber</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Color defaults to white in dark mode
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Show Creator Signature toggle - only if cover letter has content */}
            {form.watch("viewerPageCoverLetter") && account?.signature_url && (
              <FormItem className="flex flex-col rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/50">
                <div className="flex flex-row items-center justify-between">
                  <div className="grow space-y-0.5">
                    <FormLabel className="pr-2 text-base">
                      Show Your Signature
                    </FormLabel>
                    <FormDescription className="pr-4">
                      Display your profile signature at the end of the cover letter for a personal, classic touch
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={showCreatorSignature}
                      onCheckedChange={(checked) => {
                        setShowCreatorSignature(checked)
                        form.setValue("showCreatorSignature", checked, { shouldDirty: true })
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="displayMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Mode</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select display mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">
                        Auto (detect orientation)
                      </SelectItem>
                      <SelectItem value="slideshow">
                        Slideshow (for pitch decks)
                      </SelectItem>
                      <SelectItem value="document">
                        Document (traditional scroll)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How the document should be displayed. Auto mode shows
                    landscape PDFs as slideshows.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {link && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current File</p>
                      <p className="text-sm text-muted-foreground">
                        {link.filename}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_SITE_URL}/links/view/${link.id}`
                        )
                        toast({
                          description: "Link copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (link.url) {
                          window.open(link.url, "_blank")
                        }
                      }}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Upload a new file below to replace the current one, or leave
                  empty to keep it
                </p>
              </div>
            )}
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? "Drop the file here ..."
                    : file
                    ? `File selected: ${file.name}`
                    : link
                    ? "Drag & drop or click to upload a replacement file"
                    : "Drag & drop or click to upload a file"}
                </p>
                {!file && (
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB
                  </p>
                )}
                {file && (
                  <p className="text-xs text-muted-foreground">
                    Size: {(file.size / (1024 * 1024)).toFixed(2)}MB
                  </p>
                )}
              </div>
            </div>

            {isUploading && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Uploading file...</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isUploading ||
                (!file && !link) ||
                (!!link && !file && !logoFile && !form.formState.isDirty)
              }
            >
              {isUploading
                ? "Uploading..."
                : link
                ? "Update Link"
                : "Create Link"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
