/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db"],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
