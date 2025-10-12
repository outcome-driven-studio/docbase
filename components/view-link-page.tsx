"use client"

import { useState } from "react"

import { Database } from "@/types/supabase"
import SecurePDFViewer from "@/components/secure-pdf-viewer"
import ViewLinkForm from "@/components/view-link-form"

type Link = Database["public"]["Tables"]["links"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]

export default function ViewLinkPage({
  link,
  account,
}: {
  link: Link
  account: User | null
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
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

  return (
    <div className="w-full">
      <h1 className="mb-6 text-center text-3xl font-bold">{link.filename}</h1>
      <ViewLinkForm
        link={link}
        account={account}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  )
}
