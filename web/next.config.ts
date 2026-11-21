import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // @ts-ignore
    agentUpgrade: "security",
  },
}

export default nextConfig
