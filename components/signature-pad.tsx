"use client"

import { useRef, useState } from "react"
import { Check, Eraser, Upload } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

interface SignaturePadProps {
  isOpen: boolean
  onClose: () => void
  onSign: (signatureData: string, signatureType: "drawn" | "uploaded") => void
  signerName: string
  signerEmail: string
}

export function SignaturePad({
  isOpen,
  onClose,
  onSign,
  signerName,
  signerEmail,
}: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(
    null
  )
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [activeTab, setActiveTab] = useState("draw")

  function clearSignature() {
    signatureRef.current?.clear()
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedSignature(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleSign() {
    if (!consentAccepted) {
      toast({
        title: "Consent required",
        description: "Please accept the electronic signature consent",
        variant: "destructive",
      })
      return
    }

    let signatureData: string
    let signatureType: "drawn" | "uploaded"

    if (activeTab === "draw") {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        toast({
          title: "No signature",
          description: "Please draw your signature",
          variant: "destructive",
        })
        return
      }
      signatureData = signatureRef.current.toDataURL()
      signatureType = "drawn"
    } else {
      if (!uploadedSignature) {
        toast({
          title: "No signature",
          description: "Please upload your signature",
          variant: "destructive",
        })
        return
      }
      signatureData = uploadedSignature
      signatureType = "uploaded"
    }

    onSign(signatureData, signatureType)
    handleClose()
  }

  function handleClose() {
    setConsentAccepted(false)
    setUploadedSignature(null)
    clearSignature()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
          <DialogDescription>
            Please provide your signature to complete this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Signer Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm">
              <span className="font-medium">Signing as:</span> {signerName} (
              {signerEmail})
            </p>
          </div>

          {/* Signature Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="draw">Draw Signature</TabsTrigger>
              <TabsTrigger value="upload">Upload Signature</TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-4">
              <div className="rounded-lg border bg-white p-2">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-40 border rounded",
                    style: { touchAction: "none" },
                  }}
                  backgroundColor="white"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                <Eraser className="mr-2 size-4" />
                Clear
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Upload className="mx-auto mb-4 size-12 text-muted-foreground" />
                <Label htmlFor="signature-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Click to upload your signature image
                  </span>
                  <Input
                    id="signature-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </Label>
                <p className="mt-2 text-xs text-muted-foreground">
                  PNG, JPG up to 2MB
                </p>
              </div>
              {uploadedSignature && (
                <div className="rounded-lg border p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedSignature}
                    alt="Uploaded signature"
                    className="mx-auto h-32 object-contain"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Consent Checkbox */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-1"
              />
              <label
                htmlFor="consent"
                className="text-sm text-yellow-800 dark:text-yellow-200"
              >
                <strong>Electronic Signature Consent:</strong> I agree that my
                electronic signature is the legal equivalent of my handwritten
                signature. I consent to be legally bound by this document&apos;s
                terms and conditions.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!consentAccepted}>
              <Check className="mr-2 size-4" />
              Sign Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
