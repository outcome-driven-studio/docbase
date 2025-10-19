import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Github } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GridBackground } from "@/components/grid-background"

export default async function IndexPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let account = null
  if (user) {
    const { data: accountData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    account = accountData
  }

  // Check if signups are disabled
  const signupsDisabled = process.env.DISABLE_SIGNUPS === "true"

  return (
    <div className="mih-h-dvh flex flex-col">
      <GridBackground />
      <main className="container mx-auto my-48 grow">
        <section className="mx-auto max-w-3xl text-center">
          <h1
            style={{
              fontFamily: "var(--font-cursive)",
            }}
            className="text-8xl font-semibold"
          >
            Vibe Docs
          </h1>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
            }}
            className="mb-2 text-2xl"
          >
            {siteConfig.tagline}
          </h1>
          <p className="text-md mx-auto mt-4 max-w-xl">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {user ? (
              <Link href="/links">
                <Button className="bg-primary text-primary-foreground transition-opacity hover:opacity-70">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href={signupsDisabled ? "/login" : "/signup"}>
                <Button className="bg-primary text-primary-foreground transition-opacity hover:opacity-70">
                  {signupsDisabled ? "Sign In" : "Get Started"}
                </Button>
              </Link>
            )}
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost">
                <Github className="mr-2 size-4" />
                GitHub
              </Button>
            </Link>
          </div>
        </section>
        <section className="mt-24 flex justify-center"></section>
      </main>
    </div>
  )
}
