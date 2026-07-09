// next.config.ts - Next.js configuration for Service Suite
// See: https://nextjs.org/docs/app/api-reference/next-config-js/introduction

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;