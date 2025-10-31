import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import LinkForm from "@/components/link-form"

export default async function NewLinkFromDocument({
  params,
}: {
  params: { documentId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let { data: account } = await supabase
    .from("users")
    .select()
    .eq("id", user.id)
    .single()

  // Create user record if it doesn't exist (fallback)
  if (!account) {
    const { data: newAccount, error } = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
        },
        { onConflict: "id" }
      )
      .select()
      .single()

    if (error) {
      console.error("Error creating user account:", error)
      redirect("/account")
    }
    account = newAccount
  }

  // Verify the document exists and belongs to the user
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, filename, created_by")
    .eq("id", params.documentId)
    .single()

  if (docError || !document) {
    redirect("/docs")
  }

  if (document.created_by !== user.id) {
    redirect("/docs") // Don't allow creating links for other people's documents
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-center text-3xl font-bold">
        Create New Link
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        For document: <strong>{document.filename}</strong>
      </p>
      <LinkForm link={null} account={account} documentId={params.documentId} />
    </div>
  )
}
