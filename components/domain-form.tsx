"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon, RefreshCw } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Database } from "@/types/supabase"
import { clientLogger } from "@/lib/client-logger"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"

const domainFormSchema = z.object({
  domainName: z.string().min(1, "Domain name is required"),
  apiKey: z.string().min(1, "API key is required"),
  senderName: z.string().min(1, "Sender name is required"),
})

type DomainFormValues = z.infer<typeof domainFormSchema>
type User = Database["public"]["Tables"]["users"]["Row"]
type Domain = Database["public"]["Tables"]["domains"]["Row"]

export default function DomainForm({
  account,
  domain,
}: {
  account: User | null
  domain: Domain | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDomains, setIsFetchingDomains] = useState(false)
  const [availableDomains, setAvailableDomains] = useState<
    Array<{ id: string; name: string; status: string }>
  >([])
  const supabase = createClient()

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domainName: domain?.domain_name || "",
      apiKey: domain?.api_key || "",
      senderName: domain?.sender_name || "",
    },
  })

  const fetchDomainsFromResend = async (apiKey: string) => {
    if (!apiKey) return

    setIsFetchingDomains(true)
    try {
      const response = await fetch("/api/fetch-resend-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const result = await response.json()

      if (result.error) {
        toast({
          title: "Error fetching domains",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setAvailableDomains(result.domains || [])

      if (result.domains && result.domains.length > 0) {
        toast({
          description: `Found ${result.domains.length} domain(s) in your Resend account`,
        })
      } else {
        toast({
          title: "No domains found",
          description:
            "Please add a domain in Resend Dashboard first, then fetch again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      clientLogger.error("Error fetching Resend domains", { error })
      toast({
        title: "Error",
        description: "Failed to fetch domains from Resend",
        variant: "destructive",
      })
    } finally {
      setIsFetchingDomains(false)
    }
  }

  const onSubmit = async (data: DomainFormValues) => {
    if (!account) {
      toast({
        title: "Error",
        description: "User account not found",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let domainId = domain?.id

      // Check if the domain name is being changed
      if (!domain || data.domainName !== domain.domain_name) {
        // Create the domain using the Resend API only if it's new or the name has changed
        const response = await fetch("/api/create-domain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error || "Failed to create domain")
        }

        if (!result.id) {
          throw new Error("Invalid domain data received from API")
        }

        domainId = result.id
      }

      // Update or insert the domain in the database
      const { error } = domain
        ? await supabase
            .from("domains")
            .update({
              domain_name: data.domainName,
              sender_name: data.senderName,
              api_key: data.apiKey,
            })
            .eq("id", domain.id)
        : await supabase.from("domains").insert({
            id: domainId,
            created_at: new Date().toISOString(),
            domain_name: data.domainName,
            user_id: account.id,
            sender_name: data.senderName,
            api_key: data.apiKey,
          })

      if (error) {
        throw error
      }

      toast({
        title: domain ? "Domain updated" : "Domain created and saved",
        description: domain
          ? "Your domain has been successfully updated."
          : "Your domain has been successfully created and saved to your profile.",
      })
    } catch (error) {
      clientLogger.error("Error creating/updating domain", { error })
      toast({
        title: "Error creating domain",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Settings</CardTitle>
        <CardDescription>
          {domain
            ? "Update your domain settings"
            : "Configure your domain for sending emails"}
        </CardDescription>
        {!domain && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Before you start:</strong> You must first add and verify
              your domain in{" "}
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Resend Dashboard
              </a>
              . This ensures your emails are properly authenticated and
              delivered.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center space-x-2">
                      <span>API Key</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="size-4 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs font-normal">
                              Docbase uses{" "}
                              <a
                                href="https://www.resend.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Resend
                              </a>{" "}
                              to power emails from the platform. Please sign up
                              for an account, grab your API key, and paste it
                              here to start sending emails from your domain.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setAvailableDomains([]) // Clear domains when API key changes
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchDomainsFromResend(field.value)}
                      disabled={!field.value || isFetchingDomains}
                    >
                      {isFetchingDomains ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      <span className="ml-2">Fetch Domains</span>
                    </Button>
                  </div>
                  <FormDescription>
                    Enter your Resend API key, then click &quot;Fetch
                    Domains&quot;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <FormControl>
                    {availableDomains.length > 0 ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verified domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDomains.map((d) => (
                            <SelectItem key={d.id} value={d.name}>
                              {d.name}
                              {d.status === "verified" && (
                                <span className="ml-2 text-xs text-green-600">
                                  ✓ Verified
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        {...field}
                        disabled
                        placeholder="Fetch domains from Resend first"
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    {availableDomains.length > 0
                      ? "Select a domain from your Resend account"
                      : "Enter your API key and click 'Fetch Domains' to see available domains"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    The name that will appear in the &quot;From&quot; field of
                    your emails
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || (!domain && availableDomains.length === 0)}
            >
              {isLoading
                ? "Saving..."
                : domain
                ? "Update Domain"
                : "Save Domain"}
            </Button>
            {!domain && availableDomains.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Please enter API key and fetch domains first
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
