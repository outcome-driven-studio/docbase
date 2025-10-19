import { ImageResponse } from "next/og"
import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/supabase"

type Link = Database["public"]["Tables"]["links"]["Row"] & {
  creator_name: string | null
}

type Investment = {
  fund_name: string | null
  company_name: string | null
  investor_name: string | null
}

function getFallbackOGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: "#fafafa",
          backgroundImage:
            "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px",
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div
            style={{
              textAlign: "center",
              fontSize: "120px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Vibe
            </span>
            <span style={{ color: "black" }}>Docs</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "#666",
            display: "flex",
          }}
        >
          Forked from Docbase by Alana Goyal
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
    }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type")
  const supabase = createClient()

  if (type === "investment") {
    const { data: investment } = await supabase
      .rpc("select_investment_entities", { investment_id: id })
      .single<Investment>()

    const companyName = investment?.company_name ?? null
    const investorName = investment?.investor_name ?? null
    const fundName = investment?.fund_name ?? null

    if (!companyName || !fundName) {
      return getFallbackOGImage()
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#fafafa",
            backgroundImage:
              "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            fontFamily: "Arial, sans-serif",
            padding: "40px",
          }}
        >
          <div style={{ fontSize: "32px", display: "flex" }}>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                display: "flex",
                alignItems: "center",
              }}
            >
              Vibe
            </span>
            <span style={{ color: "black" }}>Docs</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                color: "#666",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {investorName} is sharing an investment with you
            </div>
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: "black",
                display: "flex",
                alignItems: "center",
              }}
            >
              {fundName} &lt;&gt; {companyName}
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              display: "flex",
            }}
          >
            Forked from Docbase by Alana Goyal
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } else {
    const { data: link } = await supabase
      .rpc("select_link", {
        link_id: id,
      })
      .single<Link>()

    const filename = link?.filename
    const creatorName = link?.creator_name || "Someone"

    if (!filename) {
      return getFallbackOGImage()
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#fafafa",
            backgroundImage:
              "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            fontFamily: "Arial, sans-serif",
            padding: "40px",
          }}
        >
          <div style={{ fontSize: "32px", display: "flex" }}>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                display: "flex",
                alignItems: "center",
              }}
            >
              Vibe
            </span>
            <span style={{ color: "black" }}>Docs</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                color: "#666",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {creatorName} is sharing a file with you
            </div>
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: "black",
                display: "flex",
                alignItems: "center",
              }}
            >
              {filename || "Untitled Document"}
            </div>
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              display: "flex",
            }}
          >
            Forked from Docbase by Alana Goyal
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}