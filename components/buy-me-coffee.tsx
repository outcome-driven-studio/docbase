"use client"

import { useEffect } from "react"

export function BuyMeCoffee() {
  useEffect(() => {
    const script = document.createElement("script")
    script.setAttribute("data-name", "BMC-Widget")
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
    script.setAttribute("data-id", "ani.ods")
    script.setAttribute("data-description", "Support me on Buy me a coffee!")
    script.setAttribute(
      "data-message",
      "Building cool stuff takes caffeine. Help fuel the next release ☕"
    )
    script.setAttribute("data-color", "#e9e9e9")
    script.setAttribute("data-position", "Right")
    script.setAttribute("data-x_margin", "18")
    script.setAttribute("data-y_margin", "18")
    script.async = true

    script.onload = function () {
      const evt = document.createEvent("Event")
      evt.initEvent("DOMContentLoaded", false, false)
      window.dispatchEvent(evt)
    }

    document.head.appendChild(script)

    return () => {
      script.remove()
      const widget = document.getElementById("bmc-wbtn")
      if (widget) widget.remove()
    }
  }, [])

  return null
}
