"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface KeyboardShortcutsContextType {
  enabled: boolean
  toggleShortcuts: () => void
}

const KeyboardShortcutsContext = createContext<
  KeyboardShortcutsContextType | undefined
>(undefined)

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [enabled, setEnabled] = useState<boolean>(true)

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("keyboard-shortcuts-enabled")
    if (stored !== null) {
      setEnabled(stored === "true")
    }
  }, [])

  const toggleShortcuts = () => {
    setEnabled((prev) => {
      const newValue = !prev
      localStorage.setItem("keyboard-shortcuts-enabled", String(newValue))
      return newValue
    })
  }

  return (
    <KeyboardShortcutsContext.Provider value={{ enabled, toggleShortcuts }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error(
      "useKeyboardShortcuts must be used within a KeyboardShortcutsProvider"
    )
  }
  return context
}
