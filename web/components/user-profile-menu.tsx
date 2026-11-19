"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Shield, ShieldCheck, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

/**
 * Compute avatar initial(s) from the user's full name.
 * Handles titles like Dr. / Prof. cleanly (e.g. "Dr. Le Thanh Tung" -> "LT").
 */
function getAvatarInitial(fullName?: string, accountType?: string, role?: string) {
  if (accountType === "guest") return "G"
  const trimmed = String(fullName || "").trim()
  if (!trimmed) {
    if (role === "tutor") return "LT"
    if (role === "admin") return "AD"
    return "ST"
  }
  // Strip academic / formal prefixes
  const cleaned = trimmed.replace(/^(dr\.|prof\.|assoc\.\s*prof\.|mr\.|ms\.|mrs\.)\s+/i, "")
  const parts = cleaned.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return cleaned.substring(0, 2).toUpperCase()
}

export function UserProfileMenu() {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isGuest = currentUser?.accountType === "guest"
  const isTutor = currentUser?.role === "tutor"
  const isAdmin = currentUser?.role === "admin"

  const displayName = isGuest
    ? "Guest Student"
    : currentUser?.fullName || (isTutor ? "Dr. Le Thanh Tung" : "Student")

  const statusBadge = isGuest
    ? "Guest"
    : isTutor
    ? "Tutor"
    : isAdmin
    ? "Admin"
    : "Student"

  const avatarInitial = getAvatarInitial(
    currentUser?.fullName,
    currentUser?.accountType,
    currentUser?.role
  )

  const badgeColorClass = isGuest
    ? "bg-warning text-surface-secondary"
    : isTutor
    ? "bg-primary text-surface-secondary"
    : isAdmin
    ? "bg-purple-500 text-white"
    : "bg-cyan text-surface-secondary"

  const statusTextColorClass = isGuest
    ? "text-warning"
    : isTutor
    ? "text-primary"
    : isAdmin
    ? "text-purple-400"
    : "text-cyan"

  const pillBadgeClass = isGuest
    ? "bg-warning/15 text-warning"
    : isTutor
    ? "bg-primary/15 text-primary"
    : isAdmin
    ? "bg-purple-500/15 text-purple-400"
    : "bg-cyan/15 text-cyan"

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    logout()
    router.push("/auth")
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-surface/40"
      >
        {isAdmin ? (
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white shadow-[0_0_12px_rgba(168,85,247,0.45)] ring-2 ring-purple-400/50">
            <ShieldCheck className="size-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#16161e]" />
          </div>
        ) : (
          <span
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${badgeColorClass}`}
          >
            {avatarInitial}
          </span>
        )}
        <div className="hidden text-left sm:block min-w-0">
          <div className="text-xs leading-tight font-semibold text-text-primary truncate max-w-[120px]">
            {displayName}
          </div>
          <div
            className={`text-[10px] leading-tight font-medium ${statusTextColorClass}`}
          >
            {statusBadge}
          </div>
        </div>
        <ChevronDown
          className={`size-3.5 text-text-secondary transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-[100] mt-2 w-64 overflow-hidden rounded-xl border border-border-subtle bg-surface p-2 shadow-2xl backdrop-blur-md">
          <div className="border-b border-border-subtle pb-2.5 pt-1 px-1.5">
            <div className="flex items-center gap-2.5">
              {isAdmin ? (
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white shadow-[0_0_14px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/60">
                  <ShieldCheck className="size-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-surface" />
                </div>
              ) : (
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeColorClass}`}
                >
                  {avatarInitial}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-xs font-bold text-text-primary">
                    {displayName}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      isAdmin
                        ? "border border-purple-500/40 bg-purple-500/20 text-purple-300 shadow-sm"
                        : pillBadgeClass
                    }`}
                  >
                    {isGuest ? (
                      <User className="size-2.5" />
                    ) : (
                      <ShieldCheck className="size-2.5" />
                    )}
                    {statusBadge}
                  </span>
                </div>
                {currentUser?.email && (
                  <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                    {currentUser.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-1.5 space-y-1">
            {(isTutor || isAdmin) && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#bb9af7] transition-colors hover:bg-[#bb9af7]/15"
              >
                <Shield className="size-3.5 text-[#bb9af7]" />
                <span>Admin Console</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-danger transition-colors hover:bg-danger/12"
            >
              <LogOut className="size-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
