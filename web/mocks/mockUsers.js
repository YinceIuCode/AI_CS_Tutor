/**
 * Mock Users for AlgoPath Frontend Authentication Demo.
 * Demo credentials only — never use real personal credentials.
 */

export const DEMO_USERS = [
  {
    id: "user-demo-student-01",
    email: "student@algopath.demo",
    // Used only for in-memory mock verification; never persisted to sessionStorage/localStorage
    passwordHash: "algopath_demo_hash::Demo1234",
    fullName: "Demo Student",
    role: "student",
    accountType: "registered",
  },
]

/**
 * Simple deterministic non-plaintext hash helper for mock demo comparison.
 * Prevents storing plaintext passwords in memory or browser storage.
 */
export function computeMockPasswordDigest(rawPassword = "") {
  return `algopath_demo_hash::${String(rawPassword)}`
}
