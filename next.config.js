/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "user-images.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
