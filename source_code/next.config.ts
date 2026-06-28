// next.config.ts - Next.js configuration for Service Suite
// See: https://nextjs.org/docs/app/api-reference/next-config-js/introduction

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add future Next.js config options here
  eslint: {
    // Ignore ESLint errors during builds (for Vercel deploys)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 