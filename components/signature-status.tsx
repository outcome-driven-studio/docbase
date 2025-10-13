"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { CheckCircle2, Clock, Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Signature = {
  id: string
  signer_email: string
  signer_name: string
  signature_type: string
  signed_at: string
  consent_accepted: boolean
}

export function SignatureStatus({ linkId }: { linkId: string }) {
  const supabase = createClient()
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignatures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId])

  async function fetchSignatures() {
    try {
      const { data, error } = await supabase.rpc("get_link_signatures", {
        link_id_arg: linkId,
      })

      if (error) throw error
      setSignatures(data || [])
    } catch (error) {
      console.error("Error fetching signatures:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading signatures...</p>
    )
  }

  if (signatures.length === 0) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Awaiting Signature</strong> - No signatures yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Signatures
            </CardTitle>
            <CardDescription>
              {signatures.length} signature{signatures.length !== 1 ? "s" : ""}{" "}
              collected
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Download className="mr-2 size-4" />
            Certificate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signatures.map((sig) => (
            <div key={sig.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{sig.signer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sig.signer_email}
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 size-3" />
                  Signed
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Signed on</p>
                  <p className="font-medium">
                    {new Date(sig.signed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{sig.signature_type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
