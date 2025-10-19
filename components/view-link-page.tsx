"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { GridBackground } from "@/components/grid-background"
import SecurePDFViewer from "@/components/secure-pdf-viewer"
import { SignaturePad } from "@/components/signature-pad"
import ViewLinkForm from "@/components/view-link-form"

type Link = Database["public"]["Tables"]["links"]["Row"] & {
  creator_name?: string | null
  creator_signature_url?: string | null
}
type User = Database["public"]["Tables"]["users"]["Row"]

// Helper to map font selection to actual font family
const getFontFamily = (font: string | null) => {
  switch (font) {
    case "cursive":
      return "'Caveat', cursive"
    case "arial":
      return "Arial, sans-serif"
    case "times":
      return "'Times New Roman', serif"
    case "georgia":
      return "Georgia, serif"
    case "mono":
      return "'Courier New', monospace"
    default:
      return "'Caveat', cursive"
  }
}

// Helper to map color selection to CSS classes
const getColorClass = (color: string | null) => {
  switch (color) {
    case "gray-800":
      return "text-gray-800 dark:text-white"
    case "black":
      return "text-black dark:text-white"
    case "blue-600":
      return "text-blue-600 dark:text-white"
    case "indigo-600":
      return "text-indigo-600 dark:text-white"
    case "purple-600":
      return "text-purple-600 dark:text-white"
    case "green-600":
      return "text-green-600 dark:text-white"
    case "red-600":
      return "text-red-600 dark:text-white"
    case "amber-700":
      return "text-amber-700 dark:text-white"
    default:
      return "text-gray-800 dark:text-white"
  }
}

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

      // Send notification to document creator (or all parties if counter-signing)
      try {
        await fetch("/api/notify-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId: link.id,
            signerEmail: account.email,
            signerName: account.name || account.email,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError)
        // Don't fail the signature process if email fails
      }

      // Check if all parties have signed (for completion notification)
      const { data: allSignatures } = await supabase
        .from("signatures")
        .select("signer_email")
        .eq("link_id", link.id)

      const isFullySigned = allSignatures && allSignatures.length >= 2

      toast({
        title: "Document signed!",
        description: isFullySigned
          ? "All parties have signed. Both parties will be notified."
          : "Your signature has been recorded. The other party has been notified.",
      })
    } catch (error: any) {
      toast({
        title: "Error signing document",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // For view-only documents: Show document if authenticated OR if no full auth required
  // For signature documents: Show document only if authenticated AND signed
  const canViewDocument =
    (!link.require_signature && isAuthenticated) || // View-only, email captured
    (link.require_signature && isAuthenticated && isSigned) // Signature doc, signed

  if (canViewDocument) {
    return (
      <div className="w-full">
        <GridBackground />
        {/* Logo, Heading, Subheading, and Cover Letter */}
        {(link.viewer_page_logo_url ||
          link.viewer_page_heading ||
          link.viewer_page_subheading ||
          link.viewer_page_cover_letter) && (
          <div className="mx-auto max-w-4xl space-y-2 px-2 py-2 sm:px-4 sm:py-3 mb-4">
            {link.viewer_page_cover_letter && (
              <div
                className="relative mx-auto max-w-3xl border border-amber-200/60 bg-white bg-gradient-to-br from-amber-50/80 via-yellow-50/50 to-orange-50/60 p-4 shadow-md dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 sm:p-4"
                style={{
                  background: "#fffcf4",
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(251, 191, 36, 0.02) 2px,
                      rgba(251, 191, 36, 0.02) 4px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(251, 191, 36, 0.015) 2px,
                      rgba(251, 191, 36, 0.015) 4px
                    )
                  `,
                }}
              >
                {/* Stamp in top left corner */}
                <img
                  src="/VibeTM-Stamp.png"
                  alt="Stamp"
                  className="ml-[-8px] h-16 w-16 object-contain opacity-80 sm:h-24 sm:w-24"
                />
                <p
                  className={`mt-4 whitespace-pre-wrap text-sm leading-relaxed sm:text-2xl ${getColorClass(
                    link.cover_letter_color
                  )}`}
                  style={{
                    fontFamily: getFontFamily(link.cover_letter_font),
                  }}
                >
                  {link.viewer_page_cover_letter}
                </p>
                {link.show_creator_signature && link.creator_signature_url && (
                  <div className="mt-8 flex flex-col items-start sm:mt-12">
                    <img
                      src={link.creator_signature_url}
                      alt="Signature"
                      className="h-8 w-auto object-contain sm:h-10"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <SecurePDFViewer
          linkId={link.id}
          filename={link.filename || "document.pdf"}
          allowDownload={link.allow_download !== false}
          displayMode={
            (link.display_mode as "auto" | "slideshow" | "document") || "auto"
          }
          logoUrl={link.viewer_page_logo_url}
          pageHeading={link.viewer_page_heading}
        />
      </div>
    )
  }

  // If authenticated but signature required and not signed, show document with sign button
  if (isAuthenticated && link.require_signature && !isSigned) {
    return (
      <div className="w-full">
        <GridBackground />
        {/* Logo, Heading, Subheading, and Cover Letter */}
        {(link.viewer_page_logo_url ||
          link.viewer_page_heading ||
          link.viewer_page_subheading ||
          link.viewer_page_cover_letter) && (
          <div className="mx-auto max-w-4xl space-y-4 px-2 py-4 sm:space-y-6 sm:px-4 sm:py-8">
            {link.viewer_page_logo_url && (
              <div className="flex justify-center">
                <img
                  src={link.viewer_page_logo_url}
                  alt="Logo"
                  className="h-10 w-auto object-contain sm:h-12"
                />
              </div>
            )}
            {link.viewer_page_heading && (
              <h1 className="text-center text-xl font-medium tracking-tight sm:text-2xl md:text-3xl">
                {link.viewer_page_heading}
              </h1>
            )}
            {link.viewer_page_subheading && (
              <h2 className="text-center text-lg text-muted-foreground sm:text-xl md:text-xl">
                {link.viewer_page_subheading}
              </h2>
            )}
            {link.viewer_page_cover_letter && (
              <div
                className="relative mx-auto max-w-2xl border border-amber-200/60 bg-white bg-gradient-to-br from-amber-50/80 via-yellow-50/50 to-orange-50/60 p-4 shadow-md dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 sm:p-8"
                style={{
                  background: "#fffcf4",
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(251, 191, 36, 0.02) 2px,
                      rgba(251, 191, 36, 0.02) 4px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(251, 191, 36, 0.015) 2px,
                      rgba(251, 191, 36, 0.015) 4px
                    )
                  `,
                }}
              >
                {/* Stamp in top left corner */}
                <img
                  src="/VibeTM-Stamp.png"
                  alt="Stamp"
                  className="-ml-2 h-16 w-16 object-contain opacity-80 sm:h-24 sm:w-24"
                />
                <p
                  className={`mt-4 whitespace-pre-wrap text-xs leading-relaxed sm:text-sm ${getColorClass(
                    link.cover_letter_color
                  )}`}
                  style={{ fontFamily: getFontFamily(link.cover_letter_font) }}
                >
                  {link.viewer_page_cover_letter}
                </p>
                {link.show_creator_signature && link.creator_signature_url && (
                  <div className="mt-8 flex flex-col items-start sm:mt-12">
                    <img
                      src={link.creator_signature_url}
                      alt="Signature"
                      className="h-8 w-auto object-contain sm:h-10"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <SecurePDFViewer
          linkId={link.id}
          filename={link.filename || "document.pdf"}
          allowDownload={link.allow_download !== false}
          displayMode={
            (link.display_mode as "auto" | "slideshow" | "document") || "auto"
          }
          logoUrl={link.viewer_page_logo_url}
          pageHeading={link.viewer_page_heading}
        />

        {/* Floating Sign Button */}
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-8">
          <Button
            size="lg"
            className="bg-purple-600 text-white shadow-lg hover:bg-purple-700"
            onClick={() => setShowSignatureModal(true)}
          >
            <svg
              className="mr-2 size-4 sm:size-5"
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
            <span className="text-sm sm:text-base">
              Sign Document to Continue
            </span>
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
      <GridBackground />
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
