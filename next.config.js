/** @type {import('next').NextConfig} */
const nextConfig = {

  // ✅ FORCE NON-WWW → WWW (CRITICAL SEO FIX)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "mmmiles.com",
          },
        ],
        destination: "https://www.mmmiles.com/:path*",
        permanent: true,
      },

      // Duplicate area pages merged into one spelling each
      { source: "/cities/chennai/chrompet", destination: "/cities/chennai/chromepet", permanent: true },
      { source: "/cities/coimbatore/saravanampatty", destination: "/cities/coimbatore/saravanampatti", permanent: true },
    ];
  },

  // Existing configs (UNCHANGED)
  serverExternalPackages: ['jsonwebtoken', 'google-spreadsheet'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ FIX: allowedDevOrigins — suppresses cross-origin warning in dev
  allowedDevOrigins: ["172.16.2.42"],

  images: {
    unoptimized: true,
    // ✅ FIX: qualities array — required for Next.js 16 compatibility
    // Declares every quality value used across the codebase
    // page.js uses quality={80} and quality={85} — both listed here
    qualities: [75, 80, 85, 90],

    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],

    // ✅ KEPT: Supabase remote pattern — your car images from Supabase still work
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tktfsjtlfjxbqfvbcoqr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
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