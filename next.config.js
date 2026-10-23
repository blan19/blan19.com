// 모든 응답에 붙는 보안 헤더. HSTS 는 Vercel 이 보내므로 여기 두지 않는다.
// CSP 는 인라인 스크립트(THEME_INIT, gtag, JSON-LD)와 utterances 때문에 nonce 설계가 필요해 아직 없다.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Claude Code 전용 프로젝트: next dev 가 AGENTS.md 를 만들지 않게 한다(기존 블록도 dev 시작 때 제거).
  agentRules: false,
  // 정적 셸 + Suspense 구멍(조회수, 많이 읽힌 글, /tech 태그 필터)으로 렌더한다. 'use cache' 를 쓸 수 있다.
  cacheComponents: true,
  // Partial Prefetching 은 끈다(명시해야 경고가 없다). 켜면 목록에 없는 /tech/<slug> 에 App Shell 을 먼저 보내
  // notFound() 가 200 + noindex 로 바뀌고, 모든 페이지 HTML 이 크게 늘었다(글 약 180KB → 285KB).
  partialPrefetching: false,
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
