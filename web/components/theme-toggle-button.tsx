"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export interface ThemeToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * ThemeToggleButton displays a dedicated Sun / Moon icon button
 * to switch seamlessly between Crisp Developer Slate Dark and Light themes.
 * Positioned on the Navbar beside the User Profile and PWA Download buttons.
 */
export function ThemeToggleButton({
  className,
  ...props
}: ThemeToggleButtonProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light/dark theme"
      title={isDark ? "Switch to Light Mode (Crisp Slate)" : "Switch to Dark Mode (Developer Slate)"}
      className={cn(
        "group relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-primary shadow-sm transition-all duration-200 hover:border-primary hover:bg-surface-elevated active:scale-95",
        className
      )}
      {...props}
    >
      {isDark ? (
        <Sun className="size-4 text-warning transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
      ) : (
        <Moon className="size-4 text-primary transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      )}
    </button>
  )
}
