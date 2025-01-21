/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable streaming SSR
    serverActions: true,
  },
  // Production-optimized configuration
  distDir: '.next',
  // Ensure proper handling of environment variables with fallbacks
  env: process.env.NODE_ENV === 'production' 
    ? {
        // Use environment variables in production
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    : {
        // Development fallbacks
        NEXT_PUBLIC_API_URL: 'https://rlaxacnkr.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        NEXT_PUBLIC_SUPABASE_URL: 'https://rlaxacnkr.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'default-key',
      },
  // Optimize for AWS deployment
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  // Handle dynamic routes properly
  async rewrites() {
    return [];
  },
}

export default nextConfig 