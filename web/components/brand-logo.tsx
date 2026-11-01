import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  iconClassName?: string
  textClassName?: string
  priority?: boolean
}

const SIZE_CONFIGS = {
  sm: {
    // -translate-y-[2px] optically centers the < > bracket body with the adjacent wordmark text
    iconWrapper: "h-6 w-auto shrink-0 flex items-center justify-center -translate-y-[2px]",
    iconHeight: 22,
    iconWidth: 33, // 304 / 200 * 22 ≈ 33.4
    fontSize: "text-base tracking-tight",
    gap: "gap-2.5",
  },
  md: {
    // -translate-y-[3px] balances the diamond accent so the < > brackets align dead center with OffByOne
    iconWrapper: "h-7 w-auto shrink-0 flex items-center justify-center -translate-y-[3px]",
    iconHeight: 26,
    iconWidth: 40, // 304 / 200 * 26 ≈ 39.5
    fontSize: "text-lg tracking-tight",
    gap: "gap-3",
  },
  lg: {
    // -translate-y-[3.5px] for large display variant
    iconWrapper: "h-8.5 w-auto shrink-0 flex items-center justify-center -translate-y-[3.5px]",
    iconHeight: 32,
    iconWidth: 49, // 304 / 200 * 32 ≈ 48.6
    fontSize: "text-xl tracking-tight",
    gap: "gap-3",
  },
} as const

export function BrandLogo({
  size = "md",
  showWordmark = true,
  className,
  iconClassName,
  textClassName,
  priority = false,
  ...props
}: BrandLogoProps) {
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md

  return (
    <div
      className={cn("inline-flex items-center select-none", cfg.gap, className)}
      {...props}
    >
      {/* OffByOne Official Icon Symbol (Preserves 100% original aspect ratio & crispness) */}
      <div className={cn(cfg.iconWrapper, iconClassName)}>
        <Image
          src="/brand-icon.png"
          alt="OffByOne Icon"
          width={cfg.iconWidth}
          height={cfg.iconHeight}
          priority={priority}
          className="h-full w-auto object-contain transition-transform group-hover:scale-105"
        />
      </div>

      {/* OffByOne Wordmark */}
      {showWordmark && (
        <span
          className={cn(
            "font-sans font-bold leading-none inline-flex items-center",
            cfg.fontSize,
            textClassName
          )}
        >
          <span className="text-[#C0CAF5]">OffBy</span>
          <span className="bg-gradient-to-r from-[#7DCFFF] via-[#7AA2F7] to-[#BB9AF7] bg-clip-text text-transparent">
            One
          </span>
        </span>
      )}
    </div>
  )
}
