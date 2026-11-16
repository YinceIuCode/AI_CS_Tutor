import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ""

/**
 * Check whether Supabase environment variables are available and valid.
 * Respects NEXT_PUBLIC_USE_MOCK_DATA flag.
 */
export const isSupabaseConfigured = (): boolean => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return false
  }
  return Boolean(
    supabaseUrl &&
      supabaseUrl.startsWith("http") &&
      supabaseKey &&
      !supabaseKey.includes("your-anon")
  )
}

let clientInstance: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  } catch (err) {
    console.warn("[OffByOne] Failed to initialize Supabase client:", err)
  }
} else {
  if (typeof window !== "undefined") {
    console.info(
      "[OffByOne] Supabase is not configured or NEXT_PUBLIC_USE_MOCK_DATA=true. Running in Mock Fallback mode."
    )
  }
}

export const supabase = clientInstance
