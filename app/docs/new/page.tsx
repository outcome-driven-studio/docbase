import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import LinkForm from "@/components/link-form"

export default async function NewLink() {
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
      redirect("/account") // Redirect to account page to show setup instructions
    }
    account = newAccount
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">New Link</h1>
      <LinkForm link={null} account={account} />
    </div>
  )
}
