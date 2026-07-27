const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db-finance"],
  // @lamunn/db-finance's Prisma client is generated to a non-default name
  // (node_modules/.prisma/client-finance, to avoid colliding with @lamunn/db's
  // client at node_modules/@prisma/client). Next.js only auto-traces the
  // query engine binary for the conventional "@prisma/client" package name,
  // so a differently-named client needs to be force-included explicitly.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, ".."),
    outputFileTracingIncludes: {
      "/**": ["../packages/db-finance/node_modules/.prisma/client-finance/**"],
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
