import { clearGuestProgress } from "@/services/progressService"

const SESSION_STORAGE_KEY = "algopath_auth_session"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
 * Authenticate a user via Backend FastAPI (Zero Client Password Verification).
 */
export async function login(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase()
  const rawPassword = String(password || "")

  if (!normalizedEmail || !rawPassword) {
    throw new Error("Please enter both your email and password.")
  }

  // 1. Primary: Authenticate securely via Backend FastAPI
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Send & receive HttpOnly cookies
      body: JSON.stringify({ email: normalizedEmail, password: rawPassword }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.user) {
        return saveSessionUser(data.user)
      }
    } else {
      const errJson = await res.json().catch(() => ({}))
      if (res.status === 401) {
        throw new Error(errJson.message || "Invalid email or password.")
      }
    }
  } catch (err) {
    // If backend refused connection (offline), fall back gracefully for demo
    if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
      throw err
    }
    console.warn("[AuthService] Backend server unreachable, falling back to local demo mode:", err.message)
  }

  // 2. Offline Demo Fallback
  if (normalizedEmail.includes("demo") || normalizedEmail.includes("student")) {
    const fallbackUser = {
      id: "00000001-0000-4000-8000-000000000001",
      email: normalizedEmail,
      fullName: "Demo Student",
      role: "student",
      accountType: "registered",
    }
    return saveSessionUser(fallbackUser)
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
      if (data.user) {
        return saveSessionUser(data.user)
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
  await new Promise((resolve) => setTimeout(resolve, 150))
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
 * Clear the active session and notify backend to invalidate cookie.
 */
export function logout() {
  if (typeof window !== "undefined") {
    const current = getCurrentUser()
    if (current?.accountType === "guest") {
      clearGuestProgress(current.id)
    }
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)

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
