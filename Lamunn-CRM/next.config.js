/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lamunn/db"],
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
};

module.exports = nextConfig;
