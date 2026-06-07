/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_DASHBOARD_AUTH_USERNAME:
      process.env.NEXT_PUBLIC_DASHBOARD_AUTH_USERNAME || process.env.VITE_DASHBOARD_AUTH_USERNAME || '',
    NEXT_PUBLIC_DASHBOARD_AUTH_EMAIL:
      process.env.NEXT_PUBLIC_DASHBOARD_AUTH_EMAIL || process.env.VITE_DASHBOARD_AUTH_EMAIL || '',
  },
}
module.exports = nextConfig
