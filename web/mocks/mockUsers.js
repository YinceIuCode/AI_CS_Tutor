/**
 * Mock Users for OffByOne Frontend Authentication Demo.
 * Demo credentials only — never use real personal credentials.
 */

export const DEMO_USERS = [
  {
    id: "user-demo-student-01",
    email: "student@offbyone.demo",
    password: "Demo1234",
    passwordHash: "offbyone_demo_hash::Demo1234",
    fullName: "Demo Student",
    role: "student",
    accountType: "registered",
  },
  {
    id: "user-demo-tutor-01",
    email: "tutor@offbyone.demo",
    password: "Tutor1234",
    passwordHash: "offbyone_demo_hash::Tutor1234",
    fullName: "Dr. Le Thanh Tung",
    role: "tutor",
    accountType: "registered",
  },
  {
    id: "user-demo-admin-01",
    email: "admin@offbyone.demo",
    password: "Admin1234",
    passwordHash: "offbyone_demo_hash::Admin1234",
    fullName: "System Admin",
    role: "admin",
    accountType: "registered",
  },
  {
    // Legacy alias to ensure backwards compatibility with previous sessions / test scripts
    id: "user-demo-student-legacy",
    email: "student@algopath.demo",
    password: "Demo1234",
    passwordHash: "offbyone_demo_hash::Demo1234",
    fullName: "Demo Student",
    role: "student",
    accountType: "registered",
  },
]

/**
 * Deterministic hash helper for mock demo comparison.
 */
export function computeMockPasswordDigest(rawPassword = "") {
  return `offbyone_demo_hash::${String(rawPassword)}`
}

/**
 * Strict verification of mock user credentials.
 * Returns the matching user object ONLY if both email AND password match 100%.
 * Returns null if user is not found or password is incorrect.
 */
export function verifyMockCredentials(email, rawPassword) {
  const normEmail = String(email || "").trim().toLowerCase()
  const password = String(rawPassword || "")

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normEmail
  )
  if (!user) {
    return null
  }

  // Strict password check
  const isMatch =
    user.password === password ||
    user.passwordHash === computeMockPasswordDigest(password) ||
    user.passwordHash === `offbyone_demo_hash::${normEmail}::${password}`

  if (!isMatch) {
    return null
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    accountType: user.accountType,
  }
}
