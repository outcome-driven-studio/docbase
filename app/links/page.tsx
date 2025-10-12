import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Links } from "@/components/links"

export const dynamic = "force-dynamic"

export default async function LinksPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // If there's a code parameter, redirect to /auth/confirm to handle it
  if (searchParams.code) {
    const code = searchParams.code as string
    redirect(`/auth/confirm?code=${code}&next=${encodeURIComponent("/links")}`)
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: account } = await supabase
    .from("users")
    .select()
    .eq("id", user.id)
    .single()

  const { data: links } = await supabase.rpc("get_user_links_with_views", {
    id_arg: user.id,
  })

  return links && links.length > 0 ? (
    <div className="container mx-auto px-4 py-8">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between py-4">
        <div className="w-[150px]" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold">
          Links
        </h1>
        <Link href="/links/new">
          <Button variant="ghost" className="w-[150px]">
            <Plus className="size-4" />
            <span className="ml-2 hidden sm:inline-block">New</span>
          </Button>
        </Link>
      </div>
      <div className="mx-auto max-w-5xl">
        <Links links={links} account={account} />
      </div>
    </div>
  ) : (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">
        You haven&apos;t created <br /> any links yet
      </h1>
      <Link href="/links/new">
        <Button variant="outline">Get Started</Button>
      </Link>
    </div>
  )
}
