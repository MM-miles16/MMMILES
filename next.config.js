/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 🚀 disables ESLint in prod builds
    devIndicators: false, // hides the route indicator completely
  },
};