"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formDescriptions } from "@/utils/form-descriptions"
import { parseSignatureBlock } from "@/utils/parse-signature-block"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Database } from "@/types/supabase"
import { clientLogger } from "@/lib/client-logger"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { toast } from "@/components/ui/use-toast"

import { EntitySelector } from "./entity-selector"
import { Icons } from "./icons"
import { PlacesAutocomplete } from "./places-autocomplete"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Textarea } from "./ui/textarea"

type Entity = (
  | Database["public"]["Tables"]["funds"]["Row"]
  | Database["public"]["Tables"]["companies"]["Row"]
) & {
  type: "fund" | "company"
  contact_id?: string
}

const accountFormSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  title: z.string().optional(),
  type: z.enum(["fund", "company"]).optional(),
  entity_name: z.string().optional(),
  byline: z.string().optional(),
  street: z.string().optional(),
  city_state_zip: z.string().optional(),
  state_of_incorporation: z.string().optional(),
})

type User = Database["public"]["Tables"]["users"]["Row"]
type AccountFormValues = z.infer<typeof accountFormSchema>

export default function AccountForm({ account }: { account: User | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  )
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [parsingSignature, setParsingSignature] = useState(false)
  const [signatureImageFile, setSignatureImageFile] = useState<File | null>(
    null
  )
  const [signatureImagePreview, setSignatureImagePreview] = useState<
    string | null
  >(account?.signature_url || null)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: account?.email || "",
      name: account?.name || "",
      title: account?.title || "",
      type: "fund",
      entity_name: "",
      byline: "",
      street: "",
      city_state_zip: "",
      state_of_incorporation: "",
    },
  })

  useEffect(() => {
    if (account) {
      fetchEntities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  async function fetchEntities() {
    if (!account) return

    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select(
        `
        id,
        name,
        email,
        title,
        is_investor,
        is_founder,
        funds (id, name, byline, street, city_state_zip),
        companies (id, name, street, city_state_zip, state_of_incorporation)
      `
      )
      .eq("user_id", account.id)

    if (contactError) {
      clientLogger.error("Error fetching contact data", { contactError })
      return
    }

    if (contactData && contactData.length > 0) {
      const contact = contactData[0]
      const entities: Entity[] = [
        ...contact.funds.map((fund: any) => ({
          ...fund,
          type: "fund" as const,
          contact_id: contact.id,
        })),
        ...contact.companies.map((company: any) => ({
          ...company,
          type: "company" as const,
          contact_id: contact.id,
        })),
      ]
      setEntities(entities)
    }
  }

  // Auto-select first entity when entities are loaded
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      const firstEntity = entities[0]
      setSelectedEntity(firstEntity.id)
      setShowAdditionalFields(true)

      // Populate form with first entity's data
      form.reset({
        ...form.getValues(),
        type: firstEntity.type,
        entity_name: firstEntity.name || "",
        byline:
          firstEntity.type === "fund" && "byline" in firstEntity
            ? firstEntity.byline || ""
            : "",
        street: firstEntity.street || "",
        city_state_zip: firstEntity.city_state_zip || "",
        state_of_incorporation:
          firstEntity.type === "company" &&
          "state_of_incorporation" in firstEntity
            ? firstEntity.state_of_incorporation || ""
            : "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities])

  async function onSubmit(data: AccountFormValues) {
    if (!account) {
      toast({
        description: "User account not found",
        variant: "destructive",
      })
      return
    }

    try {
      // Handle signature image upload if provided
      let signatureUrl = account.signature_url
      if (signatureImageFile) {
        setUploadingSignature(true)
        const signatureFileName = `${account.id}-signature-${Date.now()}`
        const { error: signatureUploadError } = await supabase.storage
          .from("cube")
          .upload(signatureFileName, signatureImageFile, { upsert: true })

        if (signatureUploadError) {
          setUploadingSignature(false)
          throw signatureUploadError
        }

        // Create signed URL for the signature (10 years expiration)
        const { data: signatureSignedData } = await supabase.storage
          .from("cube")
          .createSignedUrl(signatureFileName, 10 * 365 * 24 * 60 * 60)

        signatureUrl = signatureSignedData?.signedUrl || null
        setUploadingSignature(false)
      }

      const accountUpdates = {
        email: account.email,
        name: data.name,
        title: data.title,
        signature_url: signatureUrl,
        updated_at: new Date(),
      }

      let { error: accountError } = await supabase
        .from("users")
        .update(accountUpdates)
        .eq("id", account.id)
      if (accountError) throw accountError

      // Create or update contact
      const contactId = await processContact(data)

      if (
        data.entity_name ||
        data.byline ||
        data.street ||
        data.city_state_zip ||
        data.state_of_incorporation
      ) {
        if (data.type === "fund") {
          const isDuplicate = await processFund(data, contactId)
          if (isDuplicate) return
        } else if (data.type === "company") {
          const isDuplicate = await processCompany(data, contactId)
          if (isDuplicate) return
        }
      }

      // Mark onboarding as completed
      await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", account.id)

      toast({
        description: "Account updated",
      })
      setShowAdditionalFields(false)

      // Check if this was first-time onboarding
      if (data.name) {
        toast({
          title: "Welcome to VibeDocs!",
          description: "Your profile is set up. Let's create your first link.",
        })
        router.push("/links")
      } else {
        router.refresh()
      }
    } catch (error) {
      clientLogger.error("Error updating account", { error })
      toast({
        description: "Error updating account",
        variant: "destructive",
      })
    }
  }

  async function processContact(
    data: AccountFormValues
  ): Promise<string | null> {
    if (!account) return null

    const contactData = {
      name: data.name,
      email: account.email,
      title: data.title,
      is_investor: data.type === "fund",
      is_founder: data.type === "company",
      user_id: account.id,
      created_by: account.id,
    }

    try {
      // Check if contact already exists
      const { data: existingContact, error: selectError } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", account.id)
        .maybeSingle()

      if (selectError) {
        clientLogger.error("Error checking existing contact", { selectError })
        return null
      }

      if (existingContact) {
        // Update existing contact
        const { data: updatedContact, error: updateError } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", existingContact.id)
          .select()

        if (updateError) {
          clientLogger.error("Error updating contact", { updateError })
          return null
        }

        return updatedContact[0].id
      } else {
        // Insert new contact
        const { data: newContact, error: insertError } = await supabase
          .from("contacts")
          .insert(contactData)
          .select()

        if (insertError) {
          clientLogger.error("Error creating new contact", { insertError })
          return null
        }

        return newContact[0].id
      }
    } catch (error) {
      clientLogger.error("Error processing contact", { error })
      return null
    }
  }

  async function processFund(
    data: AccountFormValues,
    contactId: string | null
  ): Promise<boolean> {
    const fundUpdates = {
      name: data.entity_name,
      byline: data.byline,
      street: data.street,
      city_state_zip: data.city_state_zip,
      contact_id: contactId,
    }

    // Check if we're editing an existing fund or creating a new one
    const isEditing =
      selectedEntity &&
      selectedEntity !== "add-new-fund" &&
      selectedEntity !== "add-new-company"

    if (isEditing) {
      // Update existing fund
      const { error: updateError } = await supabase
        .from("funds")
        .update(fundUpdates)
        .eq("id", selectedEntity)

      if (updateError) {
        clientLogger.error("Error updating fund", { updateError })
        return true
      }

      // Update local state
      setEntities((prevEntities) =>
        prevEntities.map((entity) =>
          entity.id === selectedEntity
            ? {
                ...entity,
                name: data.entity_name || null,
                byline: data.byline || null,
                street: data.street || null,
                city_state_zip: data.city_state_zip || null,
              }
            : entity
        )
      )
      return false
    } else {
      // Creating a new fund - check for duplicates
      const { data: existingFund, error: existingFundError } = await supabase
        .from("funds")
        .select()
        .eq("name", data.entity_name)

      if (existingFundError) {
        clientLogger.error("Error checking existing fund", {
          existingFundError,
        })
        return true
      }

      if (existingFund && existingFund.length > 0) {
        form.setError("entity_name", {
          type: "manual",
          message: "A fund with this name already exists",
        })
        return true
      }

      const { data: newFund, error: newFundError } = await supabase
        .from("funds")
        .insert(fundUpdates)
        .select()

      if (newFundError) {
        clientLogger.error("Error creating fund", { newFundError })
        return true
      } else {
        setEntities((prevEntities) => [
          ...prevEntities,
          {
            ...newFund[0],
            type: "fund" as const,
            contact_id: contactId || undefined,
          },
        ])
        setSelectedEntity(undefined)
        return false
      }
    }
  }

  async function processCompany(
    data: AccountFormValues,
    contactId: string | null
  ): Promise<boolean> {
    const companyUpdates = {
      name: data.entity_name,
      street: data.street,
      city_state_zip: data.city_state_zip,
      state_of_incorporation: data.state_of_incorporation,
      contact_id: contactId,
    }

    // Check if we're editing an existing company or creating a new one
    const isEditing =
      selectedEntity &&
      selectedEntity !== "add-new-fund" &&
      selectedEntity !== "add-new-company"

    if (isEditing) {
      // Update existing company
      const { error: updateError } = await supabase
        .from("companies")
        .update(companyUpdates)
        .eq("id", selectedEntity)

      if (updateError) {
        clientLogger.error("Error updating company", { updateError })
        return true
      }

      // Update local state
      setEntities((prevEntities) =>
        prevEntities.map((entity) =>
          entity.id === selectedEntity
            ? {
                ...entity,
                name: data.entity_name || null,
                street: data.street || null,
                city_state_zip: data.city_state_zip || null,
                state_of_incorporation: data.state_of_incorporation || null,
              }
            : entity
        )
      )
      return false
    } else {
      // Creating a new company - check for duplicates
      const { data: existingCompany, error: existingCompanyError } =
        await supabase.from("companies").select().eq("name", data.entity_name)

      if (existingCompanyError) {
        clientLogger.error("Error checking existing company", {
          existingCompanyError,
        })
        return true
      }

      if (existingCompany && existingCompany.length > 0) {
        form.setError("entity_name", {
          type: "manual",
          message: "A company with this name already exists",
        })
        return true
      }

      const { data: newCompany, error: newCompanyError } = await supabase
        .from("companies")
        .insert(companyUpdates)
        .select()

      if (newCompanyError) {
        clientLogger.error("Error creating company", { newCompanyError })
        return true
      } else {
        setEntities((prevEntities) => [
          ...prevEntities,
          {
            ...newCompany[0],
            type: "company" as const,
            contact_id: contactId || undefined,
          },
        ])
        setSelectedEntity(undefined)
        return false
      }
    }
  }

  async function deleteEntity() {
    if (
      selectedEntity === "add-new-fund" ||
      selectedEntity === "add-new-company"
    ) {
      toast({
        description: `${
          selectedEntity === "add-new-fund" ? "New fund" : "New company"
        } discarded`,
      })
      setSelectedEntity(undefined)
      setShowAdditionalFields(false)
      return
    }

    const selectedEntityDetails = entities.find(
      (entity) => entity.id === selectedEntity
    )
    if (!selectedEntityDetails) return

    const entityType = selectedEntityDetails.type
    const tableName = entityType === "fund" ? "funds" : "companies"
    const referenceColumn = entityType === "fund" ? "fund_id" : "company_id"

    try {
      const { data: investmentData, error: investmentError } = await supabase
        .from("investments")
        .select()
        .eq(referenceColumn, selectedEntity)

      if (investmentData && investmentData.length > 0) {
        toast({
          description: `This ${entityType} is currently associated with an active investment and can't be deleted at this time`,
        })
        return
      }
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", selectedEntity)

      if (error) {
        toast({
          variant: "destructive",
          description: `Failed to delete the ${entityType}`,
        })
        clientLogger.error(`Error deleting ${entityType}`, { error })
      } else {
        toast({
          description: `${
            entityType.charAt(0).toUpperCase() + entityType.slice(1)
          } deleted`,
        })
        setEntities(entities.filter((entity) => entity.id !== selectedEntity))
        setSelectedEntity(undefined)
        setShowAdditionalFields(false)
      }
    } catch (error) {
      clientLogger.error(`Error processing deletion of ${entityType}`, {
        error,
      })
      toast({
        variant: "destructive",
        description: `An error occurred while deleting the ${entityType}`,
      })
    }
  }

  function handleSelectChange(value: string) {
    setSelectedEntity(value)
    setShowAdditionalFields(true)

    if (value === "add-new-fund" || value === "add-new-company") {
      form.reset({
        ...form.getValues(),
        type: value === "add-new-fund" ? "fund" : "company",
        entity_name: "",
        byline: "",
        street: "",
        city_state_zip: "",
        state_of_incorporation: "",
      })
      setSignatureFile(null)
    } else {
      // Fetch the selected entity's details and set them in the form
      const selectedEntityDetails = entities.find(
        (entity) => entity.id === value
      )
      if (selectedEntityDetails) {
        form.reset({
          ...form.getValues(),
          type: selectedEntityDetails.type,
          entity_name: selectedEntityDetails.name || "",
          byline:
            selectedEntityDetails.type === "fund" &&
            "byline" in selectedEntityDetails
              ? selectedEntityDetails.byline || ""
              : "",
          street: selectedEntityDetails.street || "",
          city_state_zip: selectedEntityDetails.city_state_zip || "",
          state_of_incorporation:
            selectedEntityDetails.type === "company" &&
            "state_of_incorporation" in selectedEntityDetails
              ? selectedEntityDetails.state_of_incorporation || ""
              : "",
        })
      }
    }
  }

  function renderAdditionalFields() {
    if (showAdditionalFields) {
      return (
        <>
          {(selectedEntity === "add-new-fund" ||
            selectedEntity === "add-new-company") && (
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"
              )}
            >
              <input {...getInputProps()} />
              <div className="text-sm text-muted-foreground">
                {isDragActive ? (
                  "Drop the signature block image here ..."
                ) : parsingSignature ? (
                  <div className="flex items-center justify-center">
                    <Icons.spinner className="size-5 animate-spin" />
                  </div>
                ) : signatureFile ? (
                  `File selected: ${signatureFile.name}`
                ) : (
                  "Drag & drop or click to upload a signature block image"
                )}
              </div>
            </div>
          )}
          <div className="flex items-start space-x-2">
            <div className="grow">
              <FormField
                control={form.control}
                name="entity_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Name</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <Icons.trash
                        className="size-5 shrink-0 cursor-pointer"
                        onClick={() => deleteEntity()}
                      />
                    </div>
                    <FormDescription>
                      {form.watch("type") === "fund"
                        ? formDescriptions.fundName
                        : formDescriptions.companyName}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          {form.watch("type") === "fund" && (
            <FormField
              control={form.control}
              name="byline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Byline (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>
                    {formDescriptions.fundByline}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <PlacesAutocomplete
            form={form}
            streetName="street"
            cityStateZipName="city_state_zip"
            disabled={false}
            onAddressChange={(street, cityStateZip) => {
              form.setValue("street", street)
              form.setValue("city_state_zip", cityStateZip)
            }}
            initialStreet={form.watch("street")}
            initialCityStateZip={form.watch("city_state_zip")}
          />
          {form.watch("type") === "company" && (
            <FormField
              control={form.control}
              name="state_of_incorporation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State of Incorporation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {formDescriptions.stateOfIncorporation}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )
    }
    return null
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSignatureFile(file)
      setParsingSignature(true)

      try {
        const parsedData = await parseSignatureBlock(file)

        form.reset({
          ...form.getValues(),
          entity_name: parsedData.entity_name || "",
          name: parsedData.name || form.getValues("name"),
          title: parsedData.title || form.getValues("title"),
          street: parsedData.street || "",
          city_state_zip: parsedData.city_state_zip || "",
          state_of_incorporation: parsedData.state_of_incorporation || "",
          byline: parsedData.byline || "",
        })

        setShowAdditionalFields(true)
        toast({
          description: "Signature block image parsed successfully",
        })
      } catch (error) {
        clientLogger.error("Error parsing signature block", { error })
        toast({
          description: "Unable to parse signature block",
        })
      } finally {
        setParsingSignature(false)
      }
    }
  }

  const onSignatureImageDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Check file size (2MB limit for signatures)
      const maxSizeInBytes = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `Maximum signature size is 2MB. Your file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`,
          variant: "destructive",
        })
        return
      }

      setSignatureImageFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setSignatureImagePreview(previewUrl)
      toast({
        description: "Signature image selected. Click Save to upload.",
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    disabled: !(
      selectedEntity === "add-new-fund" || selectedEntity === "add-new-company"
    ),
  })

  const {
    getRootProps: getSignatureRootProps,
    getInputProps: getSignatureInputProps,
    isDragActive: isSignatureDragActive,
  } = useDropzone({
    onDrop: onSignatureImageDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".svg"],
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Make changes to your profile information here
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    This is the email you log in with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name that will be used in your signature block
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the title that will be used in your signature block
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Signature Upload */}
            <div className="w-full space-y-2">
              <FormLabel>Personal Signature</FormLabel>
              <FormDescription>
                Upload your handwritten signature to personalize shared
                documents
              </FormDescription>
              <div className="space-y-3">
                {signatureImagePreview && (
                  <div className="relative inline-block rounded-lg border border-gray-300 bg-white p-3">
                    <img
                      src={signatureImagePreview}
                      alt="Signature preview"
                      className="h-16 w-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -right-2 -top-2 size-8 rounded-full p-0"
                      onClick={() => {
                        setSignatureImageFile(null)
                        setSignatureImagePreview(null)
                        // Update the database to remove signature
                        if (account) {
                          supabase
                            .from("users")
                            .update({ signature_url: null })
                            .eq("id", account.id)
                            .then(() => {
                              toast({
                                description: "Signature removed",
                              })
                            })
                        }
                      }}
                    >
                      <Icons.trash className="size-3" />
                    </Button>
                  </div>
                )}
                <div
                  {...getSignatureRootProps()}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-indigo-400",
                    isSignatureDragActive && "border-indigo-500 bg-indigo-50",
                    uploadingSignature && "pointer-events-none opacity-50"
                  )}
                >
                  <input {...getSignatureInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <Icons.signature className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isSignatureDragActive
                        ? "Drop your signature here"
                        : uploadingSignature
                        ? "Uploading..."
                        : signatureImagePreview
                        ? "Click or drag to replace signature"
                        : "Click or drag to upload your signature"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="w-full space-y-2">
                <FormLabel>Signature Blocks</FormLabel>
                <EntitySelector
                  entities={entities}
                  selectedEntity={selectedEntity}
                  onSelectChange={handleSelectChange}
                  entityType="both"
                  disabled={false}
                />
              </div>
              {renderAdditionalFields()}
              <Button className="w-full" type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
