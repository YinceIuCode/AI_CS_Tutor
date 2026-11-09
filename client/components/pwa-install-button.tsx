"use client"

import * as React from "react"
import {
  ArrowDownToLine,
  Check,
  Download,
  Laptop,
  Monitor,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from "lucide-react"
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { cn } from "@/lib/utils"

export interface PwaInstallButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "compact" | "subtle"
}

export function PwaInstallButton({
  variant = "default",
  className,
  ...props
}: PwaInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
  } = usePwaInstall()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [installSuccess, setInstallSuccess] = React.useState(false)

  const handleInstallClick = async () => {
    if (isInstalled) {
      setIsModalOpen(true)
      return
    }

    if (isInstallable) {
      const accepted = await promptInstall()
      if (accepted) {
        setInstallSuccess(true)
      }
      return
    }

    // Fallback: Show guide modal for iOS, Firefox, or unsupported platforms
    setIsModalOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Download and install OffByOne App"
        title={
          isInstalled
            ? "OffByOne is installed as a standalone app"
            : "Install OffByOne Desktop & Mobile App (PWA)"
        }
        className={cn(
          "group relative inline-flex h-9 items-center justify-start overflow-hidden rounded-lg px-2.5 font-medium transition-[width,background-color,border-color,color] duration-300 ease-out cursor-pointer",
          // Mặc định width 36px (w-9), khi hover mở rộng đều đặn lên 132px mà không nhảy padding
          "w-9 hover:w-[132px] focus-visible:w-[132px]",
          // Tokyo Night themed styling
          isInstalled
            ? "border border-success/40 bg-success/10 text-xs text-success hover:bg-success/20 hover:border-success"
            : "border border-primary/40 bg-background text-xs text-text-primary shadow-[0_0_15px_var(--color-primary-glow)] hover:border-primary hover:bg-primary/12 hover:text-cyan",
          className
        )}
        {...props}
      >
        {/* Biểu tượng Download / Checkmark cố định vị trí bên trái (16px) */}
        <div className="flex size-4 shrink-0 items-center justify-center">
          {isInstalled || installSuccess ? (
            <Check className="size-4 text-success shrink-0" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Download className="size-4 text-cyan transition-transform duration-200 group-hover:-translate-y-0.5 shrink-0" />
              {/* Chấm tín hiệu tinh tế khi sẵn sàng cài đặt PWA */}
              {isInstallable && (
                <span className="absolute -top-1 -right-1 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Text chữ: Bình thường ẩn (max-w-0 opacity-0), khi hover trượt mở sang phải mượt mà */}
        <span className="max-w-0 opacity-0 whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-out group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2 group-focus-visible:max-w-[100px] group-focus-visible:opacity-100 group-focus-visible:ml-2">
          {isInstalled || installSuccess ? "App Installed" : "Download App"}
        </span>
      </button>

      {/* ==================== PWA INSTALLATION INSTRUCTION MODAL ==================== */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-overlay transition-opacity"
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl"
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                {isIOS || isAndroid ? (
                  <Smartphone className="size-5 text-cyan" />
                ) : (
                  <Laptop className="size-5 text-cyan" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Install OffByOne
                </h3>
                <p className="text-xs text-primary">
                  Cross-Platform Standalone App (PWA)
                </p>
              </div>
            </div>

            {/* Modal Content Based on Environment */}
            <div className="mt-5 space-y-3.5 text-xs text-text-secondary">
              {isInstalled ? (
                <div className="rounded-xl border border-success/40 bg-success/10 p-3.5 leading-relaxed text-text-primary">
                  <p className="flex items-center gap-2 font-semibold text-success">
                    <Check className="size-4" /> OffByOne is installed!
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    You can launch OffByOne directly from your desktop, taskbar,
                    or application launcher without browser toolbars.
                  </p>
                </div>
              ) : isIOS ? (
                /* iOS Safari Instructions */
                <div className="space-y-3 rounded-xl border border-border-subtle bg-surface-secondary/80 p-4">
                  <p className="font-semibold text-text-primary">
                    How to install on iOS / iPadOS Safari:
                  </p>
                  <ol className="space-y-2.5 pl-1">
                    <li className="flex items-start gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-cyan">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-text-primary">Share</strong>{" "}
                        button (<Share className="inline size-3.5 text-cyan" />)
                        in your Safari browser bar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-cyan">
                        2
                      </span>
                      <span>
                        Scroll down and tap{" "}
                        <strong className="text-text-primary">
                          &ldquo;Add to Home Screen&rdquo;
                        </strong>{" "}
                        (<PlusSquare className="inline size-3.5 text-cyan" />).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-cyan">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-text-primary">Add</strong> in the top
                        right. Launch OffByOne instantly like a native app!
                      </span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Chrome / Edge / Desktop / Android Instructions */
                <div className="space-y-3 rounded-xl border border-border-subtle bg-surface-secondary/80 p-4">
                  <p className="font-semibold text-text-primary">
                    How to install on Desktop / Android:
                  </p>
                  <ol className="space-y-2.5 pl-1">
                    <li className="flex items-start gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-cyan">
                        1
                      </span>
                      <span>
                        Look at the right side of your browser address bar (URL
                        bar) for the{" "}
                        <strong className="text-text-primary">Install icon</strong>{" "}
                        (<ArrowDownToLine className="inline size-3.5 text-cyan" />)
                        or click the browser menu (⋮).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-cyan">
                        2
                      </span>
                      <span>
                        Select{" "}
                        <strong className="text-text-primary">
                          &ldquo;Install OffByOne&rdquo;
                        </strong>{" "}
                        to run in dedicated standalone mode with offline support
                        and faster loading.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Cross-Platform Perks */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-text-muted">
                <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/40 px-2.5 py-1.5">
                  <Monitor className="size-3.5 text-primary" />
                  <span>Windows &amp; Mac</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/40 px-2.5 py-1.5">
                  <Smartphone className="size-3.5 text-primary" />
                  <span>iOS &amp; Android</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-surface-secondary transition-colors hover:bg-primary-hover"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
