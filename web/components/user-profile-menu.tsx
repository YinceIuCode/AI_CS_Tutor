"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

/**
 * Compute avatar initial(s) from the user's full name.
 */
function getAvatarInitial(fullName?: string, accountType?: string) {
  if (accountType === "guest") return "G"
  const trimmed = String(fullName || "").trim()
  if (!trimmed) return "S"
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return trimmed[0].toUpperCase()
}

export function UserProfileMenu() {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isGuest = currentUser?.accountType === "guest"
  const displayName = isGuest
    ? "Guest Student"
    : currentUser?.fullName || "Student"
  const statusBadge = isGuest ? "Guest" : "Student"
  const avatarInitial = getAvatarInitial(
    currentUser?.fullName,
    currentUser?.accountType
  )

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
        className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-[#292E42]/40"
      >
        <span
          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-[#15161E] ${
            isGuest ? "bg-[#FF9E64]" : "bg-[#3DB5E6]"
          }`}
        >
          {avatarInitial}
        </span>
        <div className="hidden text-left sm:block">
          <div className="text-xs leading-tight font-semibold text-[#C0CAF5]">
            {displayName}
          </div>
          <div
            className={`text-[10px] leading-tight font-medium ${
              isGuest ? "text-[#FF9E64]" : "text-[#7DCFFF]"
            }`}
          >
            {statusBadge}
          </div>
        </div>
        <ChevronDown
          className={`size-3.5 text-[#A9B1D6] transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-[100] mt-2 w-60 overflow-hidden rounded-xl border border-[#292E42] bg-[#1A1B26] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <div className="border-b border-[#292E42] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-bold text-[#C0CAF5]">
                {displayName}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                  isGuest
                    ? "bg-[#FF9E64]/15 text-[#FF9E64]"
                    : "bg-[#9ECE6A]/15 text-[#9ECE6A]"
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
              <p className="mt-0.5 truncate font-mono text-[10px] text-[#565F89]">
                {currentUser.email}
              </p>
            )}
          </div>

          <div className="mt-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#DB4B4B] transition-colors hover:bg-[#DB4B4B]/12"
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
