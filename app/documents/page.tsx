import { Documents } from "@/components/documents"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"


export default async function DocumentsPage() {
    const supabase = createClient()
    const { data: {user}} = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: documents, error } = await supabase
    .rpc('get_user_documents', { id_arg: user.id })
    
    return documents && documents.length > 0 ? (
        <div className="container mx-auto px-4 py-8">
          <div className="relative mx-auto flex max-w-5xl items-center justify-between py-4">
            <div className="w-[150px]" />
            <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold">
              Documents
            </h1>
            <Link href="/links/new">
              <Button variant="ghost" className="w-[150px]">
                <Plus className="size-4" />
                <span className="ml-2 hidden sm:inline-block">New</span>
              </Button>
            </Link>
          </div>
          <div className="mx-auto max-w-5xl">
            <Documents documents={documents} />
          </div>
        </div>
      ) : (
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <h1 className="mb-6 text-center text-2xl font-bold">
            You haven&apos;t created <br /> any documents yet
          </h1>
          <Link href="/links/new">
            <Button variant="outline">Get Started</Button>
          </Link>
        </div>
      )}