const author = {
  name: "blan19",
  email: "oponize@naver.com",
  link: "https://github.com/blan19",
  // JSON-LD Person 설명. 홈 소개 문구(h1)와 같은 사실만 쓴다.
  description: "소프트웨어 엔지니어입니다. 문제가 생기면 원인을 끝까지 좁히고, 알게 된 것은 글로 남깁니다.",
};

const url = "https://www.blan19.xyz/";

// description 은 메타 전용(홈 meta description, layout 기본값, JSON-LD WebSite)이다. 화면에는 나오지 않는다.
const site = {
  name: "blan19 기술 블로그",
  description:
    "blan19의 기술 블로그입니다. React와 RSC, Next.js, JavaScript 메모리, WebGL과 Three.js, 팀 문화에 대해 씁니다.",
};

const config = {
  author,
  url,
  site,
};

export default config;
