"use client"

import * as React from "react"
import { Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export interface ThemeToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * ThemeToggleButton displays a dedicated sun icon button
 * to switch seamlessly between Tokyo Night Dark and Light themes.
 * Positioned beside the Login button and to the right of the download app button.
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
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={cn(
        "group relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-text-primary shadow-sm transition-all duration-200 hover:border-primary hover:bg-surface-elevated hover:text-warning active:scale-95",
        className
      )}
      {...props}
    >
      <Sun className="size-4 text-warning transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
    </button>
  )
}
