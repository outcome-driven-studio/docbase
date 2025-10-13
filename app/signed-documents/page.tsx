import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { FileCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function SignedDocumentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get documents this user has signed
  const { data: signatures } = await supabase
    .from("signatures")
    .select(
      `
      id,
      signed_at,
      signature_type,
      link_id,
      links (
        id,
        filename,
        created_at
      )
    `
    )
    .eq("signer_email", user.email)
    .order("signed_at", { ascending: false })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents I&apos;ve Signed</h1>
          <p className="mt-2 text-muted-foreground">
            View all documents you&apos;ve electronically signed
          </p>
        </div>
        <Badge variant="outline" className="text-lg">
          {signatures?.length || 0} signed
        </Badge>
      </div>

      {signatures && signatures.length > 0 ? (
        <div className="space-y-4">
          {signatures.map((sig: any) => (
            <Card key={sig.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="size-5 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">
                        {sig.links?.filename || "Document"}
                      </CardTitle>
                      <CardDescription>
                        Signed on{" "}
                        {new Date(sig.signed_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/links/view/${sig.link_id}`}>
                    <Button size="sm" variant="outline">
                      View Document
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Signature Method</p>
                    <p className="font-medium capitalize">
                      {sig.signature_type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="mb-4 size-16 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">
              No signed documents yet
            </p>
            <p className="text-sm text-muted-foreground">
              Documents you sign will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
