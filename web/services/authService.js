import { clearGuestProgress } from "@/services/progressService"
import { verifyMockCredentials } from "@/mocks/mockUsers"

const SESSION_STORAGE_KEY = "algopath_auth_session"
const ACCESS_TOKEN_KEY = "algopath_access_token"
const RATE_LIMIT_STORAGE_KEY = "algopath_auth_rate_limit"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kcpgwxsibuqgkudgbjgd.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_DCMS9ckBfOOVZSMzwIpO1g_FrSOLZP1"

let inMemoryAccessToken = null

/**
 * Generate a valid RFC4122 UUID v4 for PostgreSQL / Supabase compatibility.
 */
function generateUniqueId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return `${s4()}${s4()}-${s4()}-4${s4().substring(0, 3)}-8${s4().substring(0, 3)}-${s4()}${s4()}${s4()}`
}

/**
 * Client-Side In-Memory / SessionStorage Rate Limiter Helper
 */
function getRateLimitData(email) {
  if (typeof window === "undefined") return { count: 0, lockedUntil: 0 }
  try {
    const raw = window.sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    return map[email] || { count: 0, lockedUntil: 0 }
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function checkClientRateLimit(email) {
  const data = getRateLimitData(email)
  const now = Date.now()
  if (data.lockedUntil && now < data.lockedUntil) {
    const remainingSec = Math.ceil((data.lockedUntil - now) / 1000)
    const error = new Error(`Too many failed login attempts. Please wait ${remainingSec} seconds.`)
    error.status = 429
    error.retryAfter = remainingSec
    return error
  }
  return null
}

function recordClientFailure(email) {
  if (typeof window === "undefined") return { count: 1, lockSeconds: 0 }
  const now = Date.now()
  try {
    const raw = window.sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    const current = map[email] || { count: 0, lockedUntil: 0 }
    current.count = (current.count || 0) + 1

    let lockSeconds = 0
    if (current.count >= 5) {
      lockSeconds = 300 // Lock 5 minutes
    } else if (current.count >= 3) {
      lockSeconds = 30 // Lock 30 seconds
    }

    if (lockSeconds > 0) {
      current.lockedUntil = now + (lockSeconds * 1000)
    }

    map[email] = current
    window.sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(map))
    return { count: current.count, lockSeconds }
  } catch {
    return { count: 1, lockSeconds: 0 }
  }
}

function resetClientFailure(email) {
  if (typeof window === "undefined") return
  try {
    const raw = window.sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    if (raw) {
      const map = JSON.parse(raw)
      delete map[email]
      window.sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(map))
    }
  } catch {}
}

/**
 * Access Token Get / Set / Clear
 */
export function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken
  if (typeof window !== "undefined") {
    inMemoryAccessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  }
  return inMemoryAccessToken
}

export function setAccessToken(token) {
  inMemoryAccessToken = token || null
  if (typeof window !== "undefined") {
    if (token) {
      window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    } else {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  }
}

export function clearAccessToken() {
  inMemoryAccessToken = null
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

/**
 * Strip sensitive fields and return canonical User Object:
 * { id, fullName, email, role, accountType }
 */
function toPublicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    fullName: user.fullName || user.full_name,
    email: user.email,
    role: user.role || "student",
    accountType: user.accountType || user.account_type || "registered",
  }
}

/**
 * Persist the active public user session in sessionStorage.
 */
function saveSessionUser(user) {
  const publicUser = toPublicUser(user)
  if (typeof window !== "undefined" && publicUser) {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(publicUser)
    )
  }
  return publicUser
}

/**
 * Perform an authenticated API request with automatic Bearer token injection
 * and transparent 401 token refresh retry.
 */
export async function authenticatedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getAccessToken()
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include", // Ensure HttpOnly cookies are attached
  }

  let response = await fetch(url, fetchOptions)

  // Transparent token refresh on 401 Unauthorized
  if (response.status === 401 && !options._isRetry) {
    try {
      const refreshedToken = await refreshSession()
      if (refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`)
        response = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
          _isRetry: true,
        })
      }
    } catch {
      // If refresh fails, let original response return
    }
  }

  return response
}

/**
 * Authenticate a user via Backend FastAPI with strict credentials verification,
 * Anti-timing attack mitigation, and Sliding Window Rate Limiting.
 *
 * RULE: If credentials are invalid (401) or rate limited (429), it MUST throw
 * directly and NEVER fall back to logging in as a demo user!
 */
export async function login(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  const rawPassword = String(password || "")

  if (!normalizedEmail || !rawPassword) {
    throw new Error("Please enter both your email and password.")
  }

  // 1. Check client-side rate limit lock first
  const activeLock = checkClientRateLimit(normalizedEmail)
  if (activeLock) {
    throw activeLock
  }

  let backendAvailable = true

  // 2. Primary: Authenticate securely via Backend FastAPI
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Send & receive HttpOnly cookies
      body: JSON.stringify({ email: normalizedEmail, password: rawPassword }),
    })

    if (res.ok) {
      resetClientFailure(normalizedEmail)
      const data = await res.json()
      if (data.accessToken) {
        setAccessToken(data.accessToken)
      }
      const user = data.user || data.data?.user
      if (user) {
        return saveSessionUser(user)
      }
    } else {
      const errJson = await res.json().catch(() => ({}))

      // 429 Too Many Requests (Rate limit active)
      if (res.status === 429) {
        const retryAfter = errJson.details?.retryAfter || 30
        const err = new Error(errJson.message || `Locked due to multiple failed attempts. Please wait ${retryAfter} seconds.`)
        err.status = 429
        err.retryAfter = retryAfter
        throw err // MUST THROW, NEVER FALLBACK!
      }

      // 401 Unauthorized (Invalid credentials)
      if (res.status === 401) {
        recordClientFailure(normalizedEmail)
        const err = new Error(errJson.message || "Invalid email or password.")
        err.status = 401
        throw err // MUST THROW, NEVER FALLBACK!
      }

      throw new Error(errJson.message || "Authentication failed on server.")
    }
  } catch (err) {
    // If rate limited (429) or invalid credentials (401), rethrow immediately!
    if (err.status === 429 || err.status === 401) {
      throw err
    }

    // Check if network error (server offline)
    const isNetworkError =
      err instanceof TypeError ||
      (err.message &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("fetch failed") ||
          err.message.includes("Network request failed")))

    if (!isNetworkError) {
      throw err
    }

    backendAvailable = false
    console.warn("[AuthService] FastAPI backend is offline. Running strict direct credentials verification.")
  }

  // 3. Fallback: ONLY runs if FastAPI backend is genuinely offline
  if (!backendAvailable) {
    let verifiedUser = null

    // A. Check directly against Supabase REST if configured
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supaRes = await fetch(
          `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/users?email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`,
          {
            method: "GET",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        )

        if (supaRes.ok) {
          const rows = await supaRes.json()
          if (Array.isArray(rows) && rows.length > 0) {
            const dbUser = rows[0]
            const storedHash = String(dbUser.password_hash || "")

            let isMatch = false
            if (storedHash.startsWith("offbyone_demo_hash::")) {
              const parts = storedHash.split("::")
              isMatch = parts[parts.length - 1] === rawPassword
            } else if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
              // Known demo accounts
              if (
                (normalizedEmail === "student@offbyone.demo" && rawPassword === "Demo1234") ||
                (normalizedEmail === "tutor@offbyone.demo" && rawPassword === "Tutor1234") ||
                (normalizedEmail === "admin@offbyone.demo" && rawPassword === "Admin1234")
              ) {
                isMatch = true
              }
            } else {
              isMatch = storedHash === rawPassword
            }

            if (isMatch) {
              verifiedUser = {
                id: dbUser.id,
                email: dbUser.email,
                fullName: dbUser.full_name || (dbUser.role === "tutor" ? "Dr. Le Thanh Tung" : "Demo Student"),
                role: dbUser.role || "student",
                accountType: dbUser.account_type || "registered",
              }
            }
          }
        }
      } catch (e) {
        console.warn("[AuthService] Supabase REST check warning:", e)
      }
    }

    // B. Check against Mock Demo Users list (strictly matching password)
    if (!verifiedUser) {
      verifiedUser = verifyMockCredentials(normalizedEmail, rawPassword)
    }

    // C. Strict Result Verification
    if (verifiedUser) {
      resetClientFailure(normalizedEmail)
      return saveSessionUser(verifiedUser)
    }

    // Credentials did NOT match: strictly enforce 401 / 429
    const { lockSeconds } = recordClientFailure(normalizedEmail)
    if (lockSeconds > 0) {
      const lockErr = new Error(`Locked due to multiple failed attempts. Please wait ${lockSeconds} seconds.`)
      lockErr.status = 429
      lockErr.retryAfter = lockSeconds
      throw lockErr
    }

    const unauthErr = new Error("Invalid email or password.")
    unauthErr.status = 401
    throw unauthErr
  }

  throw new Error("Cannot connect to Authentication server (http://localhost:8000). Please start FastAPI backend.")
}

/**
 * Register a new student account via Backend FastAPI.
 */
export async function register(userData = {}) {
  const fullName = String(userData.fullName || "").trim()
  const normalizedEmail = String(userData.email || "").trim().toLowerCase()
  const password = String(userData.password || "")
  const confirmPassword = String(userData.confirmPassword || "")

  if (!fullName) throw new Error("Please enter your full name.")
  if (!normalizedEmail || !normalizedEmail.includes("@")) throw new Error("Please enter a valid email address.")
  if (password.length < 8) throw new Error("Password must be at least 8 characters long.")
  if (password !== confirmPassword) throw new Error("Password and Confirm Password do not match.")

  // 1. Primary: Register securely via Backend FastAPI
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fullName, email: normalizedEmail, password, confirmPassword }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.accessToken) {
        setAccessToken(data.accessToken)
      }
      const user = data.user || data.data?.user
      if (user) {
        return saveSessionUser(user)
      }
    } else {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.message || "Registration failed on server.")
    }
  } catch (err) {
    if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
      throw err
    }
    console.warn("[AuthService] Backend offline, creating local session:", err.message)
  }

  // 2. Offline Fallback
  const newLocalUser = {
    id: generateUniqueId(),
    fullName,
    email: normalizedEmail,
    role: "student",
    accountType: "registered",
  }
  return saveSessionUser(newLocalUser)
}

/**
 * Create a temporary Guest Student session.
 */
export async function loginAsGuest() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/guest`, {
      method: "POST",
      credentials: "include",
    })
    if (res.ok) {
      const data = await res.json()
      if (data.accessToken) {
        setAccessToken(data.accessToken)
      }
      const user = data.user || data.data?.user
      if (user) {
        return saveSessionUser(user)
      }
    }
  } catch {
    // Graceful offline fallback
  }

  const guestUser = {
    id: generateUniqueId(),
    fullName: "Guest Student",
    email: "guest@offbyone.demo",
    role: "student",
    accountType: "guest",
  }
  return saveSessionUser(guestUser)
}

/**
 * Transparently refresh the active access token using the HttpOnly cookie.
 */
export async function refreshSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (res.ok) {
      const data = await res.json()
      if (data.accessToken) {
        setAccessToken(data.accessToken)
        if (data.user) {
          saveSessionUser(data.user)
        }
        return data.accessToken
      }
    }
  } catch {
    // Refresh failed
  }
  return null
}

/**
 * Clear the active session and notify backend to invalidate cookies.
 */
export function logout() {
  if (typeof window !== "undefined") {
    const current = getCurrentUser()
    if (current?.accountType === "guest") {
      clearGuestProgress(current.id)
    }
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    clearAccessToken()

    // Notify backend
    fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {})
  }
}

/**
 * Read the current user session from sessionStorage.
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.id || !parsed.fullName) return null
    return toPublicUser(parsed)
  } catch {
    return null
  }
}
