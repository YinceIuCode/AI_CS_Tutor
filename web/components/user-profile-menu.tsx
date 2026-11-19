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
        <span
          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${badgeColorClass}`}
        >
          {avatarInitial}
        </span>
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
        <div className="absolute right-0 z-[100] mt-2 w-60 overflow-hidden rounded-lg border border-border-subtle bg-surface p-1.5 shadow-xl">
          <div className="border-b border-border-subtle px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-bold text-text-primary">
                {displayName}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${pillBadgeClass}`}
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
