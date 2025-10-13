import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import AnimatedLoginTabs from "@/components/animated-login-tabs"

import { login } from "./actions"

export default async function Login() {
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
            Sign in to your account
          </h1>
          <AnimatedLoginTabs login={login} redirect="/links" />
        </div>
        <p className="px-4 text-center text-sm text-muted-foreground md:px-8">
          Need an account?{" "}
          <Link
            href="/signup"
            className="underline underline-offset-2 hover:text-primary md:underline-offset-4"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
