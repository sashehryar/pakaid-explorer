import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.worldbank.org' },
      { protocol: 'https', hostname: '**.adb.org' },
      { protocol: 'https', hostname: 'reliefweb.int' },
    ],
  },
}

export default nextConfig
