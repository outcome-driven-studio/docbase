import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import Account from "@/components/account"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // If there's a code parameter, redirect to /auth/confirm to handle it
  if (searchParams.code) {
    const code = searchParams.code as string
    redirect(
      `/auth/confirm?code=${code}&next=${encodeURIComponent("/account")}`
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let { data: account, error: accountError } = await supabase
    .from("users")
    .select()
    .eq("id", user.id)
    .single()

  let domain = null

  // Check if the database tables exist
  if (accountError && accountError.code === "PGRST205") {
    // Database tables don't exist - show setup instructions
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-red-600">
            Database Setup Required
          </h1>
          <div className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="size-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your database tables haven&apos;t been created yet. You need
                  to run the migrations on your Supabase instance.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Setup Instructions:</h2>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Option 1: Using Supabase CLI
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-2 text-sm">
                  <li>
                    Make sure you&apos;re logged in:{" "}
                    <code className="rounded bg-gray-100 px-2 py-1">
                      npx supabase login
                    </code>
                  </li>
                  <li>
                    Link to your project:{" "}
                    <code className="rounded bg-gray-100 px-2 py-1">
                      npx supabase link
                    </code>
                  </li>
                  <li>
                    Push migrations:{" "}
                    <code className="rounded bg-gray-100 px-2 py-1">
                      npx supabase db push
                    </code>
                  </li>
                </ol>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold">
                  Option 2: Manual Migration
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-2 text-sm">
                  <li>Go to your Supabase Dashboard → SQL Editor</li>
                  <li>
                    Open the migration file:{" "}
                    <code className="rounded bg-gray-100 px-2 py-1">
                      supabase/migrations/20241017001940_initial.sql
                    </code>
                  </li>
                  <li>Copy and paste the SQL into the SQL Editor</li>
                  <li>Run the query</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <p className="text-sm text-gray-600">
                After running the migrations, refresh this page to continue.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If account doesn't exist, create it (fallback in case trigger didn't fire)
  if (!account || accountError) {
    console.log("User account not found, creating...")
    const { data: newAccount, error: insertError } = await supabase
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

    if (insertError) {
      console.error("Error creating user account:", insertError)
    } else {
      account = newAccount
      console.log("User account created successfully")
    }
  }

  const { data: domainData } = await supabase
    .from("domains")
    .select()
    .eq("user_id", user.id)
    .maybeSingle()

  domain = domainData

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">Your Account</h1>
      <Account account={account} domain={domain} />
    </div>
  )
}
