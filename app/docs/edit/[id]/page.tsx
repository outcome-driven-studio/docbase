import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import LinkForm from "@/components/link-form"

type Link = Database["public"]["Tables"]["links"]["Row"] & {
  document_id?: string | null
}

export default async function EditLink({ 
  params,
  searchParams 
}: { 
  params: { id: string }
  searchParams: { clone?: string }
}) {
  const id = params.id
  const isClone = searchParams.clone === 'true'
  
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: link } = (await supabase
    .rpc("select_link", {
      link_id: id,
    })
    .single()) as { data: Link | null }

  let { data: account } = await supabase
    .from("users")
    .select()
    .eq("id", user.id)
    .single()

  // Create user record if it doesn't exist (fallback)
  if (!account) {
    const { data: newAccount } = await supabase
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
    account = newAccount
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">
        {isClone ? 'Clone Link' : 'Edit Link'}
      </h1>
      {link ? (
        <LinkForm 
          link={isClone ? null : link} 
          account={account} 
          documentId={link.document_id} 
          cloneData={isClone ? link : undefined} 
        />
      ) : (
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <h1 className="mb-6 text-center text-2xl font-bold">
            Oops! This link doesn&apos;t exist
          </h1>
          <Link href="/docs">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

