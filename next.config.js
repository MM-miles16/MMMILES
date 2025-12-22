/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Move experimental packages to the root level (Fixes the Warning)
  serverExternalPackages: ['jsonwebtoken', 'google-spreadsheet'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tktfsjtlfjxbqfvbcoqr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
    // 2. Increase the Body Size Limit for your image uploads
    serverActions: {
      bodySizeLimit: '20mb', 
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;