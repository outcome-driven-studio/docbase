import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MagicLink from "@/components/magic-link"
import { SignupForm } from "@/components/signup-form"

import { signup } from "./actions"

export default async function Signup() {
  // Redirect if already logged in
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/links")
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
