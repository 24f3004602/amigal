/** @type {import('next').NextConfig} */

const path = require('path');

// Only load bundle analyzer when ANALYZE=true
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (config) => config;

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',

  // The monorepo root .eslintrc.js applies strict rules (import/order,
  // security/*, no-unsafe-*) across all files. Those are enforced by the
  // `lint` script; don't gate production builds on them.
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  compress: true,

  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],

    // This is an npm workspaces monorepo and we import @amigal/shared-types from
    // packages/. Pin the trace root to the repo root so file tracing follows the
    // workspace symlinks; otherwise Next infers it and the standalone layout can
    // shift between environments (which the Dockerfile's COPY paths depend on).
    outputFileTracingRoot: path.join(__dirname, '..'),
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all', priority: 10 },
        },
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
