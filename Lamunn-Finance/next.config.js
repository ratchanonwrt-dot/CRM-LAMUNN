const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db-finance"],
  // The Prisma client for @lamunn/db-finance lives in a sibling workspace
  // package (packages/db-finance/src/generated/client) instead of this app's
  // own node_modules, so Next.js's serverless file tracing doesn't discover
  // its query engine binary automatically — force it in explicitly.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, ".."),
    outputFileTracingIncludes: {
      "/**/*": ["../packages/db-finance/src/generated/client/**/*"],
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
