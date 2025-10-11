import Link from "next/link"

import AnimatedLoginTabs from "@/components/animated-login-tabs"

import { login } from "./actions"

export default async function Login() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center pt-16 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md flex flex-col space-y-6 p-4">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Sign in to your account
          </h1>
          <AnimatedLoginTabs login={login} />
        </div>
        <p className="px-4 md:px-8 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link
            href="/signup"
            className="underline underline-offset-2 md:underline-offset-4 hover:text-primary"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
