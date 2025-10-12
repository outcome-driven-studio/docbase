"use client"

import { useEffect, useState } from "react"

export function GridBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        maskImage: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
        zIndex: -1,
      }}
    />
  )
}
