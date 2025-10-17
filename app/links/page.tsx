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

  // Get documents that require the creator's counter-signature
  // (documents where someone else has signed but creator hasn't)
  const { data: pendingSignatures } = await supabase
    .from("links")
    .select(
      `
      id,
      filename,
      name,
      created_at,
      require_signature,
      signatures (
        id,
        signer_email,
        signer_name,
        signed_at
      )
    `
    )
    .eq("created_by", user.id)
    .eq("require_signature", true)

  // Filter to show only links where:
  // 1. Someone else has signed (at least one signature exists)
  // 2. Creator hasn't signed yet
  const needsCounterSignature =
    pendingSignatures?.filter((link: any) => {
      const hasOtherSignature = link.signatures.some(
        (sig: any) => sig.signer_email !== user.email
      )
      const creatorHasSigned = link.signatures.some(
        (sig: any) => sig.signer_email === user.email
      )
      return hasOtherSignature && !creatorHasSigned
    }) || []

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

      {/* Pending Counter-Signatures Section */}
      {needsCounterSignature.length > 0 && (
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="mb-4 rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <h2 className="mb-2 text-lg font-semibold text-orange-900 dark:text-orange-100">
              ⚠️ Documents Awaiting Your Signature
            </h2>
            <p className="mb-4 text-sm text-orange-700 dark:text-orange-300">
              The following documents have been signed and require your
              counter-signature to complete the signing process:
            </p>
            <div className="space-y-2">
              {needsCounterSignature.map((link: any) => {
                const lastSigner = link.signatures[link.signatures.length - 1]
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-900"
                  >
                    <div>
                      <p className="font-medium">
                        {link.name || link.filename || "Document"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Signed by {lastSigner.signer_name} on{" "}
                        {new Date(lastSigner.signed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/links/view/${link.id}`}>
                      <Button size="sm" variant="default">
                        Review & Sign
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
