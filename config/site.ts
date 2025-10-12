export const siteConfig = {
  name: "Docbase",
  tagline: "Open-source alternative to Docsend",
  description:
    "Share documents securely with permission controls, passcodes, and expiration dates",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/opengraph-image`,
  links: {
    twitter: "https://twitter.com/alanaagoyal",
    github: "https://github.com/alanagoyal/docbase",
  },
}
