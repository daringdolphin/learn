/*
<ai_context>
Configures Next.js for the app with PWA support.
</ai_context>
*/

import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.supabase.io'],
    remotePatterns: [{ hostname: "localhost" }]
  }
}

export default withPWAConfig(nextConfig)
