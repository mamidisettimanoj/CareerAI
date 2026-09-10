/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Note: Security headers should be configured at the hosting level 
  // (e.g., Vercel, Netlify) when using static export.
  // The `headers()` function is incompatible with `output: 'export'`.
}

export default nextConfig;
