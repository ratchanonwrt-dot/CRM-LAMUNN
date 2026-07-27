/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db-finance"],
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
