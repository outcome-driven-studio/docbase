"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import * as bcrypt from "bcryptjs"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Database } from "@/types/supabase"
import { clientLogger } from "@/lib/client-logger"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const linkFormSchema = z.object({
  email: z
    .string({
      required_error: "Please enter a valid email",
    })
    .email(),
  password: z.string().optional(),
})

type Link = Database["public"]["Tables"]["links"]["Row"]
type LinkFormValues = z.infer<typeof linkFormSchema>
type User = Database["public"]["Tables"]["users"]["Row"]

export default function ViewLinkForm({
  link,
  account,
  onAuthenticated,
}: {
  link: Link
  account: User | null
  onAuthenticated: () => void
}) {
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      email: account?.email || "",
      password: "",
    },
  })
  const supabase = createClient()
  const passwordRequired = !!link?.password && account
  const [progress, setProgress] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)

  useEffect(() => {
    if (account && !passwordRequired) {
      setShowProgressBar(true)
    }
  }, [account, passwordRequired])

  useEffect(() => {
    if (showProgressBar) {
      const duration = 2000 // 2 seconds
      const interval = 20 // Update every 20ms for smooth animation
      const incrementPerInterval = 100 / (duration / interval)

      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = oldProgress + incrementPerInterval
          return newProgress >= 100 ? 100 : newProgress
        })
      }, interval)

      const openLinkTimer = setTimeout(() => {
        setShowProgressBar(false)
        onAuthenticated()
      }, duration)

      return () => {
        clearInterval(timer)
        clearTimeout(openLinkTimer)
      }
    }
  }, [showProgressBar, onAuthenticated])

  async function onSubmit(data: LinkFormValues) {
    try {
      // Log viewer
      const updates = {
        link_id: link.id,
        email: data.email,
        viewed_at: new Date().toISOString(),
      }
      await supabase.from("viewers").insert(updates)

      if (account) {
        if (passwordRequired) {
          // Check password
          if (!data.password || !link.password) {
            throw new Error("Password is required")
          }

          const isPasswordCorrect = bcrypt.compareSync(
            data.password,
            link.password
          )
          if (!isPasswordCorrect) {
            throw new Error("Incorrect password")
          }
        }
        // Password is correct or not required, show progress bar
        setShowProgressBar(true)
      } else {
        // Send magic link for unauthenticated users
        const response = await fetch("/api/send-view-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: data.email, linkId: link.id }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to send magic link")
        }

        toast({
          title: "Magic link sent to " + data.email,
          description: "Please click the link in your email to continue",
        })
      }
    } catch (error: any) {
      clientLogger.error("Error in onSubmit", { error })
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
      })
    }
  }

  if (showProgressBar) {
    return (
      <div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Preparing Your Document
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please wait while we authenticate and prepare your secure document
            viewer.
          </p>
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-500 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="grow space-y-0.5">
                  <FormLabel htmlFor="email" className="pr-2 text-base">
                    Email
                  </FormLabel>
                  <FormDescription className="pr-4">
                    {account
                      ? "Your email address will only be shared with the document owner"
                      : "Please enter your email to receive a magic link"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Input
                    id="email"
                    className="w-[200px]"
                    {...field}
                    autoComplete="off"
                    disabled={!!account}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {passwordRequired && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="grow space-y-0.5">
                    <FormLabel htmlFor="password" className="pr-2 text-base">
                      Password
                    </FormLabel>
                    <FormDescription className="pr-4">
                      Please enter the password to view this document
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      className="w-[200px]"
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <div className="space-y-4">
            <Button type="submit" className="w-full">
              {account ? "View Document" : "Send Magic Link"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
