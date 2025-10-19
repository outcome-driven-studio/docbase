import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import MagicLink from "@/components/magic-link"
import { SignupForm } from "@/components/signup-form"

import { signup } from "./actions"

export default async function Signup() {
  // Check if signups are disabled
  const signupsDisabled = process.env.DISABLE_SIGNUPS === "true"

  // Redirect if already logged in
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/links")
  }

  // If signups are disabled, show message
  if (signupsDisabled) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-16 sm:px-6 md:px-8">
        <div className="flex w-full max-w-md flex-col space-y-6 p-4">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Sign Up Disabled
            </h1>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    New Signups Disabled
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This instance is not accepting new signups. Please contact the administrator
                    if you need access.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="px-4 text-center text-sm text-muted-foreground md:px-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline underline-offset-2 hover:text-primary md:underline-offset-4"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-16 sm:px-6 md:px-8">
      <div className="flex w-full max-w-md flex-col space-y-6 p-4">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Create your account
          </h1>
          <Tabs defaultValue="magic-link" className="w-full max-w-[400px] pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="magic-link">
              <MagicLink redirect="/account" />
            </TabsContent>
            <TabsContent value="email">
              <SignupForm signup={signup} />
            </TabsContent>
          </Tabs>
        </div>
        <p className="px-4 text-center text-sm text-muted-foreground md:px-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline underline-offset-2 hover:text-primary md:underline-offset-4"
          >
            Log In
          </Link>{" "}
        </p>
      </div>
    </div>
  )
}
