import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 목록에 없는 /tech/<slug> 를 글 페이지에 보내지 않고 루트 404 로 돌린다.
// 글 페이지로 가면 Cache Components 가 요청 때 prerender 하다 notFound() 를 만나 lang 도 본문도 없는
// 오류 셸(<html id="__next_error__">)을 1년 캐시로 보낸다. 루트 404 는 레이아웃과 not-found.tsx 를 서버에서 그린다.
// slug 목록은 next.config.js 가 빌드 때 contents/tech 에서 읽어 인라인한다(런타임 fs 없음).
// dev 는 설정을 서버 시작 때 한 번 읽어 새 글이 빠지므로 검사하지 않는다(목록이 없을 때도 통과시킨다).
const TECH_SLUGS = process.env.TECH_SLUGS;
const known = TECH_SLUGS ? new Set<string>(JSON.parse(TECH_SLUGS)) : null;

// /tech/<slug> 와 같은 모양인 /tech 아래 정적 파일 라우트(src/app/tech/opengraph-image.tsx). 그 폴더에 파일 라우트를 더하면 여기에도 넣는다.
const TECH_FILES = new Set(["opengraph-image"]);

const decode = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  if (!known || process.env.NODE_ENV === "development") return;
  const slug = decode(request.nextUrl.pathname.split("/")[2] ?? "");
  if (slug !== null && (known.has(slug) || TECH_FILES.has(slug))) return;
  return NextResponse.rewrite(new URL("/__not-found__", request.url));
}

export const config = {
  matcher: "/tech/:slug",
};
