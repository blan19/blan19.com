---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/styles/**"
  - "next.config.js"
---

# 프론트엔드 규칙 (Next 16 App Router, React 19, Tailwind 4)

## Tailwind 4 (`src/styles/globals.css`, tailwind.config 없음)

- 색: `@theme { --color-*: initial }` 로 기본 팔레트를 지웠다. 테마 색은 `greyscale-0`(#f8f9fa)부터 `greyscale-9`(#212529)까지와 `system-1`(#c92a2a), `system-2`(#e03131)뿐이다(팔레트와 무관한 `transparent`, `current`, `inherit` 는 쓸 수 있다). `white`, `black`, `red-500` 같은 클래스는 생성되지 않으며 오류도 나지 않는다. 새 색은 `@theme` 에 `--color-<name>` 으로 추가한다.
- 폰트: `font-pretendard` (layout.tsx 의 `localFont`, `public/font/` 의 Pretendard 400~700).
- 다크모드는 `dark:` 변형(prefers-color-scheme)만 쓴다. 토글은 없다.
- `hover:` 는 `@custom-variant hover (&:hover)` 로 v3 방식(터치 기기에서도 적용)이다.
- 공용 클래스: `.responsive`(본문 폭 컨테이너), `.card`(카드 박스). `@layer components` 에 있다.
- 클래스 이름은 소스에 문자열 그대로 써야 감지된다. `` `text-${size}` `` 같은 동적 조합은 생성되지 않는다(`ui/typography` 가 이 이유로 동작하지 않는 미사용 코드다).
- 타이포 플러그인: `@tailwindcss/typography`. `prose prose-neutral` 은 홈, `/tech`, `/log` 상단 소개 문단에만 쓴다(`prose-neutral` 은 플러그인이 hex 값을 직접 넣어 팔레트 삭제와 무관하게 동작한다). 글 본문은 아래 `.mdx-renderer` 규칙이 담당한다.

## MDX 렌더러 (`src/components/ui/mdx/index.tsx`, `.mdx-renderer`)

- react-markdown + remark-gfm 이다. 글 스타일은 `globals.css` 의 `.mdx-renderer > h3/h4/p/a/blockquote/ul/li/pre` 규칙이 담당하며 **직계 자식에만** 적용된다. 마크업 구조를 바꾸면 스타일이 빠진다.
- 커스텀 렌더: code(PrismLight, a11yDark, 등록 언어 5개), p(첫 자식이 img 면 next/image 로 바꾸고 alt 메타 파싱), a(http 는 새 탭), h3(id 앵커). TOC 는 `ui/table` 이 원문에서 `###` 를 정규식으로 뽑는다. h3 id 생성 방식을 바꾸면 TOC 도 같이 바꾼다.
- 하이라이트 언어를 추가하면 `registerLanguage` 만 늘리면 된다. 검사기(`scripts/validate-content.mjs`)가 같은 파일에서 목록을 읽는다.
- alt 메타 형식(`{priority}`, `{caption: …}`, `{WxH}`)을 바꾸면 기존 글 전부와 검사기의 `checkImageMeta` 도 함께 바꾼다.

## 컴포넌트

- 기본은 Server Component 다. `"use client"` 는 `src/app/error.tsx`, `ui/navbar`(usePathname), `ui/comment`(utterances) 세 곳뿐이다. 클라이언트 경계는 최소로 유지한다.
- `src/app/db/action.ts`, `queries.ts` 는 `"use server"` 파일이다. Client Component 에서 import 하면 export 가 공개 POST 엔드포인트가 된다(`increment` 를 누구나 호출 가능). 클라이언트에서 import 하지 않는다.
- DB 를 읽는 컴포넌트는 `<Suspense>` 로 감싸는 기존 패턴을 따른다(`View` in `tech/page.tsx`, `tech/[slug]/page.tsx`). 두 파일의 Suspense fallback `<p>` 는 `View` 의 글자 크기 클래스를 복사해 둔 것이라, 한쪽을 바꾸면 다른 쪽도 같이 바꾼다(아니면 레이아웃이 흔들린다).
- Next 16: 페이지와 `generateMetadata` 의 `params`/`searchParams` 는 `Promise` 타입이고 `await` 한다. route handler 에도 같은 규칙이 적용된다.
- 이미지는 `next/image` 를 쓴다. 원격 호스트는 `next.config.js` 의 `images.remotePatterns` 에 있어야 한다. 호스트를 추가하면 검사기도 자동으로 따라간다(설정을 require 함).
- 메타데이터는 `export const metadata` / `generateMetadata` 를 쓴다. `next/head` 는 App Router 에서 동작하지 않는다.
- 사이트 URL 은 `src/lib/config.ts` 의 `url`(`https://www.blan19.xyz/`, 끝 `/` 포함) 하나다. layout(metadataBase), robots, sitemap, `tech/[slug]`, RSS 가 모두 이 값을 쓰니 경로는 `${config.url}tech/...` 처럼 앞에 `/` 없이 붙인다. 2026-10 에 `blan19.com` 에서 옮겼고 옛 도메인은 리다이렉트할 수 없다. 저장소 이름(`blan19/blan19.com`: utterances, GitHub 첨부 이미지 URL)은 도메인과 무관하니 바꾸지 않는다.
- UI 문구는 한국어와 영어가 섞여 있다. 수정하는 화면의 기존 언어를 따른다.

## 알려진 이슈 (요청 없이 고치지 말 것)

- MDX 렌더러: fenced code 가 `<pre>` 안에 중첩된다. TOC(`ui/table`)와 h3 id 를 만드는 방식이 서로 다르다.
- `layout.tsx` 에 동작하지 않는 `next/head` 가 남아 있고 `<html lang="en">` 이다.
- OG 이미지 URL 의 title 을 인코딩하지 않는다(`tech/[slug]/page.tsx`).
- utterances 댓글(`ui/comment`)은 cleanup 이 없다.
- `generateSlug`, `getBlogTags`, `ui/tags`, `ui/typography`, `styles/theme.ts` 는 쓰이지 않는다.

화면 확인은 `/run-app` 으로 한다(DB 차단). 검증 순서는 CLAUDE.md 의 작업 규칙을 따른다.
