import { DEMO_USERS } from "@/mocks/mockUsers"
import { clearGuestProgress } from "@/services/progressService"

const SESSION_STORAGE_KEY = "algopath_auth_session"
const REGISTERED_USERS_STORAGE_KEY = "algopath_registered_users"

/**
 * One-way DJB2 hash for mock password verification so plaintext passwords are never stored in browser storage.
 */
function hashPassword(password = "") {
  let hash = 5381
  const str = `algopath_salt_${password}`
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return `h_${(hash >>> 0).toString(16)}`
}

/**
 * Generate a collision-free unique ID across tabs and devices.
 */
function generateUniqueId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  const randomSuffix = Math.random().toString(36).substring(2, 10)
  return `${prefix}-${Date.now()}-${randomSuffix}`
}
/**
 * Strip any sensitive fields and return the canonical User Object:
 * { id, fullName, email, role, accountType }
 */
function toPublicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role || "student",
    accountType: user.accountType || "registered",
  }
}

/**
 * Load all known users (built-in demo users + session-registered users).
 */
function getKnownUsers() {
  const baseUsers = DEMO_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    accountType: u.accountType,
    passwordDigest: hashPassword(
      u.passwordHash.replace("algopath_demo_hash::", "")
    ),
  }))

  if (typeof window === "undefined") {
    return baseUsers
  }

  try {
    const raw =
      window.localStorage.getItem(REGISTERED_USERS_STORAGE_KEY) ||
      window.sessionStorage.getItem(REGISTERED_USERS_STORAGE_KEY)
    if (!raw) return baseUsers
    const extraUsers = JSON.parse(raw)
    if (!Array.isArray(extraUsers)) return baseUsers
    return [...baseUsers, ...extraUsers]
  } catch {
    return baseUsers
  }
}

/**
 * Save a newly registered user record (with one-way digest only, never plaintext password).
 */
function saveRegisteredUserRecord(record) {
  if (typeof window === "undefined") return
  try {
    const raw =
      window.localStorage.getItem(REGISTERED_USERS_STORAGE_KEY) ||
      window.sessionStorage.getItem(REGISTERED_USERS_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const list = Array.isArray(existing) ? existing : []
    list.push({
      id: record.id,
      email: record.email,
      fullName: record.fullName,
      role: record.role,
      accountType: record.accountType,
      passwordDigest: record.passwordDigest,
    })
    window.localStorage.setItem(
      REGISTERED_USERS_STORAGE_KEY,
      JSON.stringify(list)
    )
  } catch {
    // Ignore storage quota errors in mock environment
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
 * Authenticate a user with email and password.
 */
export async function login(email, password) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase()
  const rawPassword = String(password || "")

  if (!normalizedEmail || !rawPassword) {
    throw new Error("Please enter both your email and password.")
  }

  // Simulated network latency
  await new Promise((resolve) => setTimeout(resolve, 450))

  const users = getKnownUsers()
  const matchedUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  )

  const inputDigest = hashPassword(rawPassword)

  if (!matchedUser || matchedUser.passwordDigest !== inputDigest) {
    throw new Error(
      "Invalid email or password. Try demo account: student@algopath.demo / Demo1234"
    )
  }

  return saveSessionUser(matchedUser)
}

/**
 * Register a new student account and immediately create an authenticated session.
 */
export async function register(userData = {}) {
  const fullName = String(userData.fullName || "").trim()
  const normalizedEmail = String(userData.email || "")
    .trim()
    .toLowerCase()
  const password = String(userData.password || "")
  const confirmPassword = String(userData.confirmPassword || "")

  if (!fullName) {
    throw new Error("Please enter your full name.")
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Please enter a valid email address.")
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  if (password !== confirmPassword) {
    throw new Error("Password and Confirm Password do not match.")
  }

  // Simulated network latency
  await new Promise((resolve) => setTimeout(resolve, 500))

  const users = getKnownUsers()
  const emailExists = users.some(
    (u) => u.email.toLowerCase() === normalizedEmail
  )

  if (emailExists) {
    throw new Error(
      "An account with this email already exists. Please log in instead."
    )
  }

  const newUserRecord = {
    id: generateUniqueId("user"),
    fullName,
    email: normalizedEmail,
    role: "student",
    accountType: "registered",
    passwordDigest: hashPassword(password),
  }

  saveRegisteredUserRecord(newUserRecord)
  return saveSessionUser(newUserRecord)
}

/**
 * Create a temporary Guest Student session.
 */
export async function loginAsGuest() {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const guestUser = {
    id: generateUniqueId("guest"),
    fullName: "Guest Student",
    email: "guest@algopath.demo",
    role: "student",
    accountType: "guest",
  }

  return saveSessionUser(guestUser)
}

/**
 * Clear the active session from sessionStorage.
 * If the active session is a temporary Guest session, clear its temporary learning progress too.
 */
export function logout() {
  if (typeof window !== "undefined") {
    const current = getCurrentUser()
    if (current?.accountType === "guest") {
      clearGuestProgress(current.id)
    }
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

/**
 * Read the current user session from sessionStorage.
 */
export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null
  }

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
