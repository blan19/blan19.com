// 정적 페이지라 nonce 를 쓸 수 없어 인라인 스크립트(테마 초기화, gtag, RSC 페이로드)는 'unsafe-inline' 으로 허용한다.
// 해시를 넣으면 CSP2+ 브라우저가 'unsafe-inline' 을 무시해 나머지 인라인 스크립트가 막히므로 넣지 않는다.
// 전체 정책은 Report-Only 로만 보낸다(위반은 브라우저 콘솔에 남고 막지 않는다). 보고 엔드포인트(report-to)는 두지 않았다.
// 강제로 옮기기 전에 배포본에서 홈, /tech, mermaid 와 이미지가 있는 글, 댓글을 열고 콘솔의 Report-Only 위반이 없는지 직접 본다.
// GA 호스트는 Google 의 GA4 CSP 안내대로 *.googletagmanager.com 와일드카드로 둔다(지역 서브도메인을 쓴다).
// mermaid 는 eval 을 쓰지 않는다. 개발 서버는 React 가 eval 을 써서 'unsafe-eval' 을 더한다(Next CSP 문서).
const fs = require("node:fs");
const path = require("node:path");

const isDev = process.env.NODE_ENV === "development";

// tech 글 slug(contents/tech/<날짜>/<slug>.mdx 의 파일명). src/proxy.ts 가 목록에 없는 /tech/<slug> 를 루트 404 로 돌릴 때 쓴다.
const techSlugs = () => {
  const dir = path.join(__dirname, "contents", "tech");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => fs.readdirSync(path.join(dir, d.name)).filter((f) => f.endsWith(".mdx")))
    .map((f) => f.slice(0, -".mdx".length));
};
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.googletagmanager.com`,
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  // 문단 안 이미지는 원격 src 를 그대로 쓰고, github.com 은 *.githubusercontent.com 으로 리다이렉트한다.
  "img-src 'self' data: blob: https://github.com https://*.githubusercontent.com https://*.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://utteranc.es",
  "worker-src 'self' blob:",
].join("; ");

// 강제하는 CSP 는 사이트를 깨지 않는 지시어만 둔다(프레임 삽입 금지, base/form/object 제한).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // interest-cohort(FLoC)는 폐기되어 Chrome 이 알 수 없는 기능이라고 경고하므로 후속인 browsing-topics 를 쓴다.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
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
  poweredByHeader: false,
  // 푸터 저작권 끝 연도(빌드한 해, 한국 시간). 빌드 때 코드에 인라인되므로 prerender 에서 현재 시각을 읽지 않고,
  // 정적 라우트와 요청 시점 라우트가 같은 값을 쓴다. 글을 올리면 배포되므로 현재 연도와 거의 같다.
  // TECH_SLUGS: tech 글 slug 의 JSON 배열(src/proxy.ts 가 읽는다).
  env: {
    BUILD_YEAR: new Intl.DateTimeFormat("en", { timeZone: "Asia/Seoul", year: "numeric" }).format(new Date()),
    TECH_SLUGS: JSON.stringify(techSlugs()),
  },
  images: {
    // 글 이미지는 GitHub 첨부(github.com/blan19/<repo>/assets/…, 새 업로드는 github.com/user-attachments/assets/…)만 쓴다.
    // pathname/search 를 좁혀 이미지 최적화가 남의 이미지나 쿼리를 바꾼 같은 이미지를 받지 않게 한다.
    // user-attachments 는 아무 GitHub 사용자나 올릴 수 있어 남용 여지가 남는다. 검사기(scripts/content/images.mjs)가 이 목록을 그대로 읽는다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/blan19/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/user-attachments/**",
        search: "",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

module.exports = nextConfig;
