import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { type EmailOtpType } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  // Ensure siteUrl has a protocol
  if (
    siteUrl &&
    !siteUrl.startsWith("http://") &&
    !siteUrl.startsWith("https://")
  ) {
    siteUrl = `http://${siteUrl}`
  }

  // Debug logging
  console.log("Auth confirm request:", {
    url: request.url,
    token_hash: token_hash ? "present" : "missing",
    code: code ? "present" : "missing",
    type,
    next,
    siteUrl,
  })

  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not defined")
    return NextResponse.redirect(
      new URL("/error?message=Configuration+error", request.url)
    )
  }

  // Default to /links instead of /account (signup explicitly sets /account)
  const redirectTo = next && next !== "/" ? next : "/links"
  const fullNextUrl = new URL(redirectTo, siteUrl)

  console.log("Redirect URL:", fullNextUrl.href)

  // Handle PKCE flow (code-based)
  if (code) {
    const supabase = createClient()

    console.log("Exchanging code for session...")

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Code exchange error:", error)
      const errorUrl = siteUrl + "/error"
      return NextResponse.redirect(
        errorUrl +
          "?next=" +
          encodeURIComponent(redirectTo) +
          "&error=" +
          encodeURIComponent(error.message)
      )
    }

    console.log("Code exchanged successfully, session established")
    console.log("Redirecting to:", fullNextUrl.href)
    return NextResponse.redirect(fullNextUrl.href)
  }

  // Handle OTP flow (token_hash-based)
  if (token_hash && type) {
    const supabase = createClient()

    console.log("Verifying token:", { type, hasToken: !!token_hash })

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error("Token verification error:", error)
      const errorUrl = siteUrl + "/error"
      return NextResponse.redirect(
        errorUrl +
          "?next=" +
          encodeURIComponent(redirectTo) +
          "&error=" +
          encodeURIComponent(error.message)
      )
    }

    console.log("Token verified successfully, getting session...")

    // Get the session to ensure it's properly established
    const { data: sessionData } = await supabase.auth.getSession()
    console.log("Session data:", sessionData?.session ? "present" : "missing")

    console.log("Redirecting to:", fullNextUrl.href)
    return NextResponse.redirect(fullNextUrl.href)
  }

  console.log("Missing token_hash/code or type, redirecting to error")
  const errorUrl = siteUrl + "/error"
  return NextResponse.redirect(
    errorUrl + "?next=" + encodeURIComponent(redirectTo)
  )
}
