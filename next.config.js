/** @type {import('next').NextConfig} */
const nextConfig = {
  // Claude Code 전용 프로젝트: next dev 가 AGENTS.md 를 만들지 않게 한다(기존 블록도 dev 시작 때 제거).
  agentRules: false,
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
