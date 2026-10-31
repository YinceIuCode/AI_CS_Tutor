"use client"

import * as React from "react"
import * as authService from "@/services/authService"

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} role
 * @property {"registered" | "guest"} accountType
 */

/**
 * @typedef {Object} RegisterPayload
 * @property {string} fullName
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser | null} currentUser
 * @property {boolean} isAuthenticated
 * @property {boolean} isInitializing
 * @property {boolean} isLoading
 * @property {(email: string, password: string) => Promise<AuthUser>} login
 * @property {(userData: RegisterPayload) => Promise<AuthUser>} register
 * @property {() => Promise<AuthUser>} loginAsGuest
 * @property {() => void} logout
 */

/** @type {React.Context<AuthContextValue | null>} */
export const AuthContext = React.createContext(null)

export function AuthProvider({ children }) {
  /** @type {[AuthUser | null, React.Dispatch<React.SetStateAction<AuthUser | null>>]} */
  const [currentUser, setCurrentUser] = React.useState(null)
  const [isInitializing, setIsInitializing] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)

  // Restore active session from sessionStorage on initial mount
  React.useEffect(() => {
    const restoredUser = authService.getCurrentUser()
    setCurrentUser(restoredUser)
    setIsInitializing(false)
  }, [])

  const login = React.useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const user = await authService.login(email, password)
      setCurrentUser(user)
      return user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = React.useCallback(async (userData) => {
    setIsLoading(true)
    try {
      const user = await authService.register(userData)
      setCurrentUser(user)
      return user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginAsGuest = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const guestUser = await authService.loginAsGuest()
      setCurrentUser(guestUser)
      return guestUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(() => {
    authService.logout()
    setCurrentUser(null)
  }, [])

  const value = React.useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isInitializing,
      isLoading,
      login,
      register,
      loginAsGuest,
      logout,
    }),
    [
      currentUser,
      isInitializing,
      isLoading,
      login,
      register,
      loginAsGuest,
      logout,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
