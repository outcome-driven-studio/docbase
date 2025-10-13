"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import SecurePDFViewer from "@/components/secure-pdf-viewer"
import { SignaturePad } from "@/components/signature-pad"
import ViewLinkForm from "@/components/view-link-form"

type Link = Database["public"]["Tables"]["links"]["Row"] & {
  require_signature?: boolean
  signature_instructions?: string | null
}
type User = Database["public"]["Tables"]["users"]["Row"]

export default function ViewLinkPage({
  link,
  account,
}: {
  link: Link
  account: User | null
}) {
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isSigned, setIsSigned] = useState(false)

  useEffect(() => {
    checkSignatureStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkSignatureStatus() {
    console.log("Checking signature status for link:", link.id)
    console.log("Link requires signature?", link.require_signature)
    console.log("Account email:", account?.email)

    // If link doesn't require signature, skip
    if (!link.require_signature) {
      console.log("Signature not required, skipping check")
      return
    }

    // Check if user already signed
    if (account?.email) {
      const { data, error } = await supabase
        .from("signatures")
        .select("id")
        .eq("link_id", link.id)
        .eq("signer_email", account.email)
        .maybeSingle()

      console.log("Signature check result:", { data, error })

      if (data) {
        console.log("User has already signed this document")
        setIsSigned(true)
      } else {
        console.log("User has NOT signed yet")
      }
    }
  }

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
    // Don't auto-show modal - user clicks button to sign
  }

  async function handleSign(
    signatureData: string,
    signatureType: "drawn" | "uploaded"
  ) {
    if (!account?.email) return

    try {
      // Get user agent for audit trail
      const userAgent = navigator.userAgent

      const { error } = await supabase.from("signatures").insert({
        link_id: link.id,
        signer_email: account.email,
        signer_name: account.name || account.email,
        signature_data: signatureData,
        signature_type: signatureType,
        user_agent: userAgent,
        consent_accepted: true,
      })

      if (error) throw error

      // Log signature event
      await supabase.from("signature_events").insert({
        link_id: link.id,
        event_type: "signed",
        signer_email: account.email,
        user_agent: userAgent,
      })

      setIsSigned(true)
      setShowSignatureModal(false)

      toast({
        title: "Document signed!",
        description:
          "Your signature has been recorded. You can now view the document.",
      })
    } catch (error: any) {
      toast({
        title: "Error signing document",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Show document only if authenticated AND (signed OR signature not required)
  if (isAuthenticated && (isSigned || !link.require_signature)) {
    return (
      <div className="w-full">
        <SecurePDFViewer
          linkId={link.id}
          filename={link.filename || "document.pdf"}
          allowDownload={link.allow_download !== false}
        />
      </div>
    )
  }

  // If authenticated but signature required and not signed, show document with sign button
  if (isAuthenticated && link.require_signature && !isSigned) {
    return (
      <div className="w-full">
        <SecurePDFViewer
          linkId={link.id}
          filename={link.filename || "document.pdf"}
          allowDownload={link.allow_download !== false}
        />

        {/* Floating Sign Button */}
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <Button
            size="lg"
            className="bg-purple-600 text-white shadow-lg hover:bg-purple-700"
            onClick={() => setShowSignatureModal(true)}
          >
            <svg
              className="mr-2 size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Sign Document to Continue
          </Button>
        </div>

        {/* Signature Modal */}
        {showSignatureModal && account && (
          <SignaturePad
            isOpen={showSignatureModal}
            onClose={() => setShowSignatureModal(false)}
            onSign={handleSign}
            signerName={account.name || account.email || ""}
            signerEmail={account.email || ""}
          />
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="mb-6 text-center text-3xl font-bold">{link.filename}</h1>
      <ViewLinkForm
        link={link}
        account={account}
        onAuthenticated={handleAuthenticated}
      />

      {/* Signature Modal */}
      {showSignatureModal && account && (
        <SignaturePad
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSign={handleSign}
          signerName={account.name || account.email || ""}
          signerEmail={account.email || ""}
        />
      )}
    </div>
  )
}
