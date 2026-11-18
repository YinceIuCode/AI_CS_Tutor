import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    agentUpgrade: "security",
  },
}

export default nextConfig
