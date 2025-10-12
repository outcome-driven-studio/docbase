import Link from "next/link"
import { Github } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { GridBackground } from "@/components/grid-background"

export default function IndexPage() {
  return (
    <div className="mih-h-dvh flex flex-col">
      <GridBackground />
      <main className="container mx-auto my-48 grow">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 text-5xl font-semibold">{siteConfig.tagline}</h1>
          <p className="text-md mx-auto mt-4 max-w-xl">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/links">
              <Button className="bg-primary text-primary-foreground transition-opacity hover:opacity-70">
                Get Started
              </Button>
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost">
                <Github className="mr-2 size-4" />
                GitHub
              </Button>
            </Link>
          </div>
        </section>
        <section className="mt-24 flex justify-center"></section>
      </main>
    </div>
  )
}
