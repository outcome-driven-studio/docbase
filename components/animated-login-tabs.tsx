"use client"

import { useEffect, useRef, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/login-form"
import MagicLink from "@/components/magic-link"

interface AnimatedLoginTabsProps {
  login: (formData: {
    email: string
    password: string
  }) => Promise<{ errorMessage?: string }>
  redirect?: string
}

export default function AnimatedLoginTabs({ login, redirect = "/links" }: AnimatedLoginTabsProps) {
  const [activeTab, setActiveTab] = useState("magic-link")
  const [containerHeight, setContainerHeight] = useState<number>(0)
  const magicLinkRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateHeight = () => {
      if (activeTab === "magic-link" && magicLinkRef.current) {
        setContainerHeight(magicLinkRef.current.offsetHeight + 8)
      } else if (activeTab === "email" && emailRef.current) {
        setContainerHeight(emailRef.current.offsetHeight + 8)
      }
    }

    // Update height immediately
    updateHeight()

    // Update height after a short delay to account for animations
    const timer = setTimeout(updateHeight, 50)

    return () => clearTimeout(timer)
  }, [activeTab])

  return (
    <Tabs
      defaultValue="magic-link"
      className="w-full max-w-[400px] pt-4"
      onValueChange={setActiveTab}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <div
        className="relative overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: containerHeight > 0 ? `${containerHeight}px` : "auto",
        }}
      >
        <TabsContent
          value="magic-link"
          className="absolute inset-0 duration-300 data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-50 data-[state=inactive]:fade-out-0 data-[state=active]:slide-in-from-left-4 data-[state=inactive]:slide-out-to-right-4"
        >
          <div ref={magicLinkRef}>
            <MagicLink redirect={redirect} />
          </div>
        </TabsContent>
        <TabsContent
          value="email"
          className="absolute inset-0 duration-300 data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:fade-in-50 data-[state=inactive]:fade-out-0 data-[state=active]:slide-in-from-right-4 data-[state=inactive]:slide-out-to-left-4"
        >
          <div ref={emailRef}>
            <LoginForm login={login} />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
