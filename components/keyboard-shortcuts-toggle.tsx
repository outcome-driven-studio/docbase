"use client"

import { Keyboard } from "lucide-react"

import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function KeyboardShortcutsToggle() {
  const { enabled, toggleShortcuts } = useKeyboardShortcuts()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShortcuts}
            aria-label={
              enabled
                ? "Disable keyboard shortcuts"
                : "Enable keyboard shortcuts"
            }
          >
            <Keyboard
              className={`size-5 ${enabled ? "text-primary" : "text-muted-foreground opacity-50"}`}
            />
            <span className="sr-only">
              {enabled
                ? "Disable keyboard shortcuts"
                : "Enable keyboard shortcuts"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Keyboard shortcuts: <strong>{enabled ? "ON" : "OFF"}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Click to {enabled ? "disable" : "enable"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
