// 사이트 정체성과 외부 서비스 설정의 단일 원본. 서버와 클라이언트가 함께 import 하므로
// server-only 를 넣지 않고 비밀 값을 두지 않는다(NEXT_PUBLIC_* 만).

export const site = {
  name: "blan19",
  title: "blan19 기술 블로그",
  // 메타 전용(meta description 기본값, 피드, llms.txt, JSON-LD WebSite). 화면에는 나오지 않는다.
  description:
    "blan19의 기술 블로그입니다. React와 RSC, Next.js, JavaScript 메모리, WebGL과 Three.js, 팀 문화에 대해 씁니다.",
  // 끝 "/" 포함. 경로는 `${site.url}tech/...` 처럼 앞에 "/" 없이 붙인다.
  url: "https://www.blan19.xyz/",
  // 본문 링크를 사이트 안 이동으로 볼 origin(끝 "/" 없음)
  origins: ["https://www.blan19.xyz", "https://blan19.xyz"],
  host: "www.blan19.xyz",
  locale: "ko",
  since: 2023,
} as const;

export const author = {
  name: "blan19",
  email: "oponize@naver.com",
  link: "https://github.com/blan19",
  // JSON-LD Person 설명. 홈 소개 문구(h1)와 같은 사실만 쓴다.
  description: "소프트웨어 엔지니어입니다. 문제가 생기면 원인을 끝까지 좁히고, 알게 된 것은 글로 남깁니다.",
};

// utterances(GitHub issues 댓글). issue 는 pathname 으로 글과 묶인다.
export const comments = {
  repo: "blan19/blan19.xyz",
  issueTerm: "pathname",
  label: "comment",
} as const;

// 비어 있으면 GA 스크립트를 넣지 않는다.
export const analytics = {
  gaId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || undefined,
};
