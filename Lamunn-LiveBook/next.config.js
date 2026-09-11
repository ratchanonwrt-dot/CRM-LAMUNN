const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db-live"],
  // @lamunn/db-live's Prisma client is generated to a non-default name
  // (node_modules/.prisma/client-live, to avoid colliding with @lamunn/db's
  // and @lamunn/db-finance's clients). Next.js only auto-traces the query engine
  // binary for the conventional "@prisma/client" package name, so a differently
  // named client needs to be force-included explicitly.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, ".."),
    outputFileTracingIncludes: {
      // Prisma bakes an absolute build-time path into the generated client as a fallback
      // search location, which is stale at runtime on Vercel (build cwd /vercel/path0 vs
      // runtime cwd /var/task/<rootDirectory>). Prisma's engine-locator also always tries
      // "<app>/node_modules/.prisma/client-live" automatically — scripts/copy-prisma-engine.js
      // (run via the "prebuild" script) copies the generated client there, so we just need
      // Next.js to bundle that copy into the deployed function.
      "/**": [
        "../packages/db-live/node_modules/.prisma/client-live/**",
        "./node_modules/.prisma/client-live/**",
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
