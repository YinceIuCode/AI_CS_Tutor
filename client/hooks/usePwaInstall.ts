"use client"

import * as React from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export interface UsePwaInstallReturn {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isMac: boolean
  isWindows: boolean
  isAndroid: boolean
  promptInstall: () => Promise<boolean>
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isMac, setIsMac] = React.useState(false)
  const [isWindows, setIsWindows] = React.useState(false)
  const [isAndroid, setIsAndroid] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Detect Standalone / Already Installed Mode
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://")

      setIsInstalled(Boolean(isStandalone))
    }
    checkInstalled()

    // 2. Detect Operating System / User Agent
    const ua = window.navigator.userAgent.toLowerCase()
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
    setIsIOS(isIOSDevice)
    setIsMac(/macintosh|mac os x/.test(ua) && !isIOSDevice)
    setIsWindows(/windows/.test(ua))
    setIsAndroid(/android/.test(ua))

    // 3. Register Service Worker for PWA criteria & offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // SW registration failed gracefully
        })
    }

    // 4. Capture BeforeInstallPrompt Event (Chromium / Edge / Android)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // 5. Listen to App Installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    // 6. Listen to display-mode change
    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    mediaQuery.addEventListener("change", handleDisplayModeChange)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      mediaQuery.removeEventListener("change", handleDisplayModeChange)
    }
  }, [])

  const promptInstall = React.useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setIsInstalled(true)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [deferredPrompt])

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isMac,
    isWindows,
    isAndroid,
    promptInstall,
  }
}
