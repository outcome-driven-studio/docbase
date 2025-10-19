export const siteConfig = {
  name: "VibeDocs",
  tagline: "Your vibe, your docs, your rules",
  description:
    "Self-hosted document sharing with e-signatures and analytics. Customize everything, own your data, skip the SaaS tax. Forked from Docbase by Alana Goyal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/api/og`,
  links: {
    twitter: "https://twitter.com/alanaagoyal",
    github: "https://github.com/outcome-driven-studio/docbase",
  },
}
