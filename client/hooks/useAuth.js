"use client"

import * as React from "react"
import { AuthContext } from "@/contexts/AuthContext"

/**
 * Custom hook to access OffByOne authentication state and actions.
 * @returns {import("@/contexts/AuthContext").AuthContextValue}
 */
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
