# blan19.xyz 의도 (Intent)

이 문서는 "왜"를 적는다. 구조는 [architecture.md](architecture.md), 디자인 값은 [design.md](design.md), 작업 규칙과 명령은 `CLAUDE.md` 와 `.claude/rules/*.md` 가 원본이다. 여기에는 드물게 바뀌는 목적, 결정, 제약만 둔다.

## 1. 이 블로그는 무엇인가

- 소프트웨어 엔지니어 blan19 의 한국어 개인 기술 블로그(https://www.blan19.xyz)다. 글은 두 종류다: tech(마크다운으로 쓴 긴 글, `/tech/<slug>`)와 log(짧은 평문 기록, `/log` 한 페이지).
- 독자: 한국어를 읽는 개발자. 검색(Google, Naver) 유입과 RSS/Atom 구독자.
- 성공 기준:
  - 읽기 편하다: 본문 17px, 회색조, 한 열, 코드와 다이어그램이 화면에서 바로 읽힌다.
  - 빠르다: 글 페이지는 빌드 때 만든 정적 HTML 이고 클라이언트 JS 는 필요한 섬(island)뿐이다.
  - 글쓰기 마찰이 적다: 저장소에 `.mdx` 파일 하나를 넣고 push 하면 끝난다. 검사기가 실수를 먼저 잡는다.
  - 운영비가 거의 없고 혼자 유지보수할 수 있다: 외부 서비스는 Vercel, Neon Postgres(조회수), utterances(GitHub issues 댓글), GitHub(이미지), Google Analytics(ID 가 있을 때만), 빌드 때의 Google Fonts(IBM Plex Mono)뿐이다(3.11).
  - DB 가 죽어도 글은 모두 보인다.

## 2. 디자인 철학: G3 "Minimal Index"

- 색상(hue)이 없는 회색조다. 강조는 잉크 대비, 굵기, 밑줄로만 한다. 예외는 둘뿐이다: 빨강은 오류 표시(404, error 코드 라벨)에만, slate 하나는 코드의 문자열과 숫자 리터럴에만 쓴다.
- 목록은 색인처럼 읽힌다: /tech 는 날짜 · 제목 · 읽는 시간 · 조회수, 홈 최근 글은 조회수 없이 날짜 · 제목, 홈 "많이 읽힌 글"은 순위 · 제목 · 조회수. 배지, 리더 점선, 형광펜 같은 장식은 없고, 순위 번호는 "많이 읽힌 글"에만 쓴다.
- 글꼴은 둘뿐이다: Pretendard(본문, 제목, UI)와 IBM Plex Mono(날짜, 수치, 코드, 메타). 세리프, 한글 이탤릭, 도장은 없다.
- ≥1280px 에서는 왼쪽 레일(섹션 라벨, 목차)과 본문 열 하나, 그 미만은 한 열이다. 오른쪽 여백 열이 없으므로 사이드노트도 없다.
- 장식은 하나만 둔다: 홈 소개 옆의 점묘 노트북(404 에서는 같은 노트북의 분해도). 정보나 링크를 담지 않고(`aria-hidden`), JS 가 없어도 서버 SVG 가 최종 이미지다. 다른 곳(헤더, 푸터, OG 이미지)에서 반복하지 않는다.
- 이전 시안과 버린 것: MARGIN(#58, 따뜻한 종이 톤, Noto Serif KR 제목, 도장 로고, 사이드노트)은 G3(#59)로 대체됐다. 색과 세리프가 많은 정보 없이 시선을 끌었고, 원래 blan19 의 흑백 톤으로 돌아갔다. 히어로의 점묘 매듭(#59)은 점묘 노트북(#61)으로 바뀌었고, 파비콘(`src/app/icon.svg`)에만 매듭이 남았다.
- 세부 값(토큰, 타입 스케일, 그리드, 컴포넌트)은 [design.md](design.md).

## 3. 핵심 결정

각 결정은 결정 / 이유 / 버린 대안 / 결과·제약 / 재검토 조건 순서로 적는다.

### 3.1 콘텐츠는 저장소 안 파일이다 (CMS 없음)

- 결정: 글은 `contents/{tech|log}/YYYY-MM-DD/<slug>.mdx` 파일이고, 배포는 git push 다.
- 이유: 글과 코드가 같이 버전 관리되고, 리뷰(PR)와 검사(content:check)를 그대로 쓸 수 있다. 서버나 계정이 늘지 않는다.
- 버린 대안: 헤드리스 CMS, DB 에 글 저장, Notion 등 외부 편집기.
- 결과·제약: 글을 고치면 배포가 한 번 돈다. 웹에서 편집하는 UI 는 없다. 런타임은 `fs` 로 읽으므로 `contents/` 는 서버 번들 옆에 있어야 한다.
- 재검토 조건: 공동 저자가 생기거나 비개발자가 글을 써야 할 때.

### 3.2 확장자는 `.mdx` 지만 MDX 가 아니다

- 결정: 본문은 GFM 마크다운으로만 해석한다. JSX, MDX 컴포넌트, raw HTML 은 렌더하지 않고 글자 그대로 보여 준다. `---js` frontmatter 는 거부한다(YAML 만).
- 이유: 글이 코드를 실행하지 않으므로 보안 면이 작고, 렌더러를 서버 한 곳에 둘 수 있다. 확장자는 기존 파일명(= slug)과 도구 호환 때문에 유지한다.
- 버린 대안: `next-mdx-remote`/`@next/mdx` 로 진짜 MDX 를 쓰는 것, 확장자를 `.md` 로 바꾸는 것(파일명 변경 → 이력 단절).
- 결과·제약: 글 안의 인터랙티브 컴포넌트는 없다. 필요한 블록(콜아웃, 코드 메타, 이미지 메타, mermaid)은 마크다운 문법 확장으로 넣는다(→ architecture.md 10장 "마크다운 블록").
- 재검토 조건: 글마다 인터랙티브 데모가 꼭 필요해질 때.

### 3.3 경로 규약과 바꿀 수 없는 slug

- 결정: 날짜 폴더 하나에 `.mdx` 하나. 파일명 = slug = URL(`/tech/<slug>`) = 조회수 DB 키 = utterances 이슈 연결 키(pathname). 공개된 slug 와 폴더는 바꾸지 않는다.
- 이유: 별도 id 없이 파일 하나로 글을 식별한다. 조회수(View.slug)와 댓글(GitHub issue 의 pathname)이 모두 이 문자열에 묶여 있다.
- 버린 대안: frontmatter 의 별도 id, DB 의 글 테이블.
- 결과·제약: slug 를 바꾸거나 글을 지우면 조회수와 댓글이 끊긴다. 리다이렉트 표도 없다. slug 는 영문 소문자, 숫자, `.`, `-` 만 쓰고, 검사기가 종류와 무관하게 유일성을 막는다(`posts.ts` 도 같은 종류 안의 중복이면 빌드를 멈춘다).
- 재검토 조건: slug 를 바꿔야 하는 글이 생기면, 먼저 조회수 행 이전과 리다이렉트를 같은 작업으로 설계한다.

### 3.4 목록 순서는 날짜 폴더 이름순이다

- 결정: 글 순서는 `publishedAt` 이 아니라 날짜 폴더 이름순이다. `posts.ts` 가 폴더 이름을 명시적으로 정렬하고 최신순은 그 역순이다.
- 이유: 폴더 이름이 곧 날짜라 정렬 기준이 하나다. 초기에 정렬 방향을 여러 번 고쳤다(#35, #38, #39). 그때는 `readdirSync` 가 돌려주는 순서에 기대었는데 지금은 직접 정렬한다.
- 버린 대안: frontmatter `publishedAt` 정렬(파일을 열어야 순서를 알고, 폴더 날짜와 어긋날 수 있다).
- 결과·제약: 새 글은 폴더 날짜와 `publishedAt` 을 같게 둔다(다르면 검사기 warn). 기존 글 하나(`2023-12-11/javascript-memory-management`, publishedAt 12-12)가 이미 다르고, 공개된 폴더는 옮기지 않으므로 그대로 둔다. `publishedAt` 은 표시, sitemap, 피드 날짜에 쓴다.
- 재검토 조건: 같은 날 여러 글을 자주 쓰게 될 때.

### 3.5 DB 는 조회수에만 쓰고, 실패는 그 칸에서 멈춘다

- 결정: Postgres 에는 `View(slug, count)` 하나만 둔다. 홈, 목록, 글 본문은 파일만으로 그린다. DB 를 읽는 컴포넌트는 `<Suspense>` 구멍 안에서 쿼리만 try/catch 하고 실패하면 `null` 을 렌더한다(글 머리 조회수 칸, 목록 행 조회수, 홈 "많이 읽힌 글" 섹션).
- 이유: DB 는 장식에 가까운 데이터다. DB 장애나 연결 수 제한이 글 읽기를 막으면 안 된다.
- 버린 대안: 조회수를 외부 분석 서비스에서 가져오기(키와 지연), 글 메타데이터를 DB 에 저장.
- 결과·제약: DB 가 실패하면 그 칸이나 섹션만 사라지고 `app/error.tsx` 로 번지지 않는다. 정적 경로(셸, generateStaticParams)에서는 쿼리하지 않는다(로컬 빌드가 운영 DB 를 읽게 되므로). 세부 패턴은 `.claude/rules/database.md`, `frontend.md`.
- 재검토 조건: 조회수 말고 사용자별 상태(좋아요, 북마크)가 필요해질 때.

### 3.6 조회수는 근사치다

- 결정: 글 페이지 요청에서 `ArticleViews` 가 렌더될 때마다 `recordView` 가 upsert 로 +1 하고 올린 값을 보여 준다(요청당 한 번. 정적 셸은 먼저 스트리밍되고, 조회수 Suspense 구멍을 채우기 전, 즉 스트리밍 응답이 끝나기 전에 await 한다. 서버리스에서 응답 뒤 쓰기가 유실되지 않게). 중복 제거, 봇 필터, 세션 구분은 없다.
- 이유: "대략 무엇이 많이 읽히는가"만 알면 된다. 정확한 집계는 비용 대비 가치가 낮다.
- 버린 대안: 쿠키/IP 기반 중복 제거, 클라이언트 비콘, GA 수치 연동.
- 결과·제약: 크롤러와 새로고침도 센다. 실제 DB 로 띄운 서버에 글 경로를 요청하면 운영 수치가 오른다(이 때문에 3.12 의 하네스가 있다). 이전 구현은 새 행을 0 으로 만들었기 때문에 그때 생긴 행은 실제보다 1 적다.
- 재검토 조건: 조회수를 공개 지표 이상의 용도(정렬 신뢰도 등)로 쓰게 될 때.

### 3.7 자체 unified 파이프라인

- 결정: `remark-parse` → `remark-gfm` → 커스텀 remark/rehype 플러그인 → HAST 를 서버에서 한 번 만들고, 같은 트리에서 목차와 앵커를 뽑는다. `ui/post-body` 가 `hast-util-to-jsx-runtime` 으로 렌더하고 figure/aside/a/img 만 컴포넌트로 바꾼다. 같은 트리로 피드 HTML 도 만든다.
- 이유: 목차와 제목 id 가 어긋날 수 없고, 렌더 비용이 서버에만 있다(마크다운 파서가 클라이언트로 가지 않는다). 플러그인은 파일 하나에 하나라 블록마다 고칠 곳이 분명하다.
- 버린 대안: react-markdown + Prism(#58 이전 구현, #58 에서 교체), MDX.
- 결과·제약: URL 안전 규칙은 react-markdown 의 `defaultUrlTransform` 을 옮겨 왔다(http, https, mailto 와 상대 URL 만). 새 블록 문법은 플러그인, figure 계약(`figures.ts`), 컴포넌트, 피드 변환, 검사기를 함께 고친다.
- 재검토 조건: 플러그인 유지 비용이 글 쓰는 시간보다 커질 때.

### 3.8 Shiki 는 서버 전용, CSS 변수 테마

- 결정: `shiki/core` + JS 정규식 엔진(wasm 없음)으로 서버에서만 하이라이트한다. 테마의 토큰 색은 `var(--sh-*)` 다.
- 이유: 하이라이트된 HTML 이 테마와 무관하게 하나라서 라이트/다크 전환은 CSS 변수 교체뿐이다. 클라이언트 JS 와 wasm 이 없다.
- 버린 대안: 테마별 HTML 두 벌(`themes: {light, dark}`), 클라이언트 하이라이터, Oniguruma wasm 엔진.
- 결과·제약: 지원 언어는 `languages.ts` 의 13개뿐이고 나머지는 색 없는 text 다. 하이라이트가 실패해도 글 전체가 오류가 되지 않는다: 블록 하나가 실패하면 그 블록만 Shiki `text` 로, 그것도 실패하면 평문으로 그리고, Shiki 초기화가 실패하면 그 글의 모든 코드 블록이 평문이 된다(평문으로 대체된 렌더는 캐시하지 않는다).
- 재검토 조건: JS 엔진이 필요한 문법을 처리하지 못할 때.

### 3.9 mermaid 는 클라이언트에서 늦게 불러온다

- 결정: ```` ```mermaid ```` 펜스는 서버에서 원문만 figure 에 싣고, `ui/mermaid` 가 화면 근처(rootMargin 400px)에 오면 `import("mermaid")` 로 불러와 그린다. `securityLevel: "strict"`.
- 이유: mermaid 는 무겁고 대부분의 글에는 없다. 서버 렌더(헤드리스 브라우저)는 빌드를 무겁게 만든다.
- 버린 대안: 빌드 때 SVG 로 굽기, 모든 글에 mermaid 번들.
- 결과·제약: 다이어그램은 JS 가 있어야 보인다(없으면 원문 소스). 테마와 모바일 여부가 바뀌면 다시 그린다.
- 재검토 조건: 다이어그램이 대부분의 글에 들어가거나 JS 없는 렌더가 필요할 때.

### 3.10 테마: system / light / dark

- 결정: 사이트 CSS 의 색은 전부 CSS 토큰이고, 다크 값은 `globals.css` 의 `@variant dark` 한 곳에 둔다(CSS 변수를 못 쓰는 `theme.ts` 의 `THEME_COLORS`, `icon.svg`, OG 카드 `og-image.tsx` 만 예외로 hex 를 직접 둔다. frontend.md). 첫 페인트 전에 `layout.tsx` 의 인라인 스크립트가 저장된 설정(`data-theme`)을 붙인다. React 상태로 색을 계산하지 않는다.
- 이유: 깜빡임 없이, 서버 HTML 하나로 세 설정을 모두 그린다.
- 버린 대안: next-themes 같은 라이브러리, 서버 쿠키로 테마 렌더(정적 HTML 이 요청마다 달라진다).
- 결과·제약: CSS 로 못 바꾸는 것(mermaid, utterances iframe, 히어로 캔버스)만 `subscribeResolvedTheme` 로 따라간다. 인라인 스크립트 때문에 CSP 에 `'unsafe-inline'` 이 필요하다(3.14).
- 재검토 조건: 테마가 셋보다 많아질 때.

### 3.11 외부 의존을 최소로 한다

- 결정: OG 이미지 폰트는 저장소에 번들한다(`src/fonts/Pretendard-Bold.woff`). 본문 폰트 Pretendard 도 로컬 파일(공식 subset_glyphs 기준 서브셋 `PretendardVariable.subset.woff2`, 약 650KB. 목록 밖 한글은 시스템 폰트로 그려진다)이고, IBM Plex Mono 는 `next/font/google` 이 빌드 때 받아 자체 호스팅한다. 댓글은 utterances(GitHub issues) iframe 을 직접 띄운다. 분석은 GA 이고 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` 가 비면 스크립트를 넣지 않는다.
- 이유: 런타임에 제3자 요청이 적을수록 빠르고 장애 지점이 적다. 댓글 저장소를 직접 운영하지 않는다.
- 버린 대안: Giscus, 자체 댓글 DB, OG 폰트 네트워크 로드, 런타임 Google Fonts.
- 결과·제약: 빌드는 Google Fonts 에 접속해야 해서 오프라인 빌드가 안 된다. utterances 는 `utterances.html` 의 비공개 쿼리 계약에 기대므로 utterances 쪽이 바뀌면 깨질 수 있다. 외부 출처 목록은 architecture.md.
- 재검토 조건: utterances 가 멈추거나 계약이 바뀔 때, GA 를 끌 때.

### 3.12 Cache Components: 정적 셸 + 조회수 구멍

- 결정: `cacheComponents: true`. 페이지는 빌드 때 정적 셸로 prerender 하고, 요청 시점 데이터(조회수, 많이 읽힌 글, `/tech` 의 `searchParams`)만 `<Suspense>` 구멍에서 스트리밍한다. 모든 글은 `generateStaticParams` 로 미리 만든다. "많이 읽힌 글"은 `'use cache: remote'` + `cacheLife("hours")` + `cacheTag("views")` 로 캐시한다(1시간마다 다시 검증하고, 그동안 오래된 값을 최대 하루까지 내줄 수 있다). `partialPrefetching` 은 끈다.
- 이유: 글 본문과 목록은 배포 사이에 바뀌지 않으므로 요청마다 다시 그릴 이유가 없다. 조회수만 요청마다 다르다.
- 버린 대안: 페이지 전체 dynamic(`unstable_noStore`), ISR(`revalidate`), 조회수를 클라이언트에서 가져오기(추가 API 와 레이아웃 이동).
- 결과·제약: `connection()` 이 prerender 를 멈추는 지점이라 빌드는 DB 를 쿼리하지 않는다. prerender 경로에서 현재 시각과 난수를 쓸 수 없다(푸터 연도는 빌드한 해 `env.BUILD_YEAR`). 떠난 페이지가 `<Activity>` 로 DOM 에 숨겨져 남으므로 클라이언트 DOM 조회는 자기 `.site-wrap` 안으로 한정한다. Partial Prefetching 을 켜면 목록에 없는 `/tech/<slug>` 가 200 + noindex 가 되고 HTML 이 커졌다(`next.config.js` 주석). 페이지의 `notFound()` 는 Cache Components 에서 lang 과 본문 없는 오류 셸(`<html id="__next_error__">`)을 내므로, `src/proxy.ts`(matcher `/tech/:slug`)가 빌드 때 `next.config.js` 가 인라인한 slug 목록(`env.TECH_SLUGS`)에 없는 slug 를 루트 404(`/__not-found__`)로 rewrite 한다. smoke 가 404 본문의 `lang="ko"` 와 not-found 제목을 확인한다. 규칙은 `CLAUDE.md` 라우트 절차.
- 재검토 조건: Vercel 배포에서 proxy 의 404 rewrite 가 기대대로 동작하지 않을 때(7장), Next 가 Cache Components 나 proxy 동작을 바꿀 때.

### 3.13 OG 이미지는 빌드 때 만든다

- 결정: 파일 규칙 `opengraph-image.tsx` 로 사이트 카드(`/`, `/tech`, `/log`)와 글 카드(글마다)를 빌드 때 PNG 로 만든다. 쿼리 문자열로 제목을 받는 런타임 `/og` 라우트는 없앴다.
- 이유: 요청 시점 렌더 비용이 없고, 임의 제목으로 이미지를 찍어 내는 엔드포인트가 사라진다.
- 버린 대안: 런타임 `/og?title=…`(인코딩 문제와 남용 여지).
- 결과·제약: 글 OG alt 는 고정 문구다(`generateImageMetadata` 로 바꾸면 URL 형태가 바뀌어 득실이 작다고 봤다). 페이지가 자기 `openGraph` 를 정의하면 상위 파일 이미지가 사라지므로 `/tech`, `/log` 에 re-export 파일을 둔다.
- 재검토 조건: 글마다 다른 디자인의 카드가 필요할 때.

### 3.14 보안 자세

- 결정:
  - Server Action 이 없다. 조회수 읽기와 쓰기는 `server-only` 모듈 `src/lib/views.ts` 하나이고, 쓰기는 존재하는 tech slug 에만 한다.
  - 응답 헤더: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`(frame-ancestors 를 모르는 옛 브라우저용), `Permissions-Policy`, 그리고 사이트를 깨지 않는 지시어만 강제하는 CSP(`frame-ancestors 'none'`, `base-uri`, `form-action`, `object-src`). 전체 CSP 는 Report-Only 로만 보낸다.
  - 원격 이미지는 `github.com/blan19/**` 와 `github.com/user-attachments/**`(쿼리 없음)만 허용한다.
  - 본문 raw HTML 미렌더, URL 프로토콜 허용 목록, mermaid strict.
- 이유: 공격 면을 정적 사이트 수준으로 줄인다. 이전의 `"use server"` 파일은 클라이언트에서 import 하면 조회수 증가가 공개 POST 엔드포인트가 될 수 있었다.
- 버린 대안: nonce 기반 엄격 CSP. 정적 페이지라 nonce 를 쓸 수 없고, 해시를 넣으면 `'unsafe-inline'` 이 무시되어 RSC 인라인 스크립트가 막힌다.
- 결과·제약: CSP 는 아직 위반을 막지 않는다(보고 엔드포인트도 없다). `user-attachments` 는 누구나 올릴 수 있어 남용 여지가 남는다.
- 재검토 조건: 7장 CSP 강제 계획.

### 3.15 운영 DB 안전 하네스

- 결정: 로컬 개발 DB 를 두지 않는 대신, 에이전트와 스크립트가 운영 DB 에 닿지 못하게 한다.
  - 차단 주소 `postgres://blocked:blocked@127.0.0.1:1/blocked`(원본 `scripts/lib/blocked-db.mjs`)를 process env 로 넣어 `.env` 를 덮는다. `verify`, `smoke`, `dev:safe`, `with-blocked-db.mjs` 가 이 경로다.
  - `.claude/hooks/guard-bash.mjs` 가 위험 명령(prisma db/migrate, vercel-build, `.env` 읽기, 차단 없는 dev/start)을 막고, 스키마 변경이 있을 때 push/PR 에 확인을 요청한다. settings 권한 deny 가 이를 보조한다.
  - `prisma db push` 는 Vercel 의 `vercel-build` 에만 있다(#51 에서 로컬 build 에서 분리).
- 이유: `.env` 가 프로덕션(Neon)을 가리키고, Preview 빌드도 같은 DB 를 쓴다고 가정해야 한다. `CLAUDE.md` 에 기록된 대로 실제 DB 로 띄운 서버에 글 경로를 요청해 운영 조회수가 오른 사고가 한 번 있었다.
- 버린 대안: 로컬 Postgres/Neon 브랜치(아직 설정하지 않음), 규칙 문서만으로 막기.
- 결과·제약: 로컬 화면에서 조회수와 "많이 읽힌 글"은 비어 보인다(정상). 훅은 모든 우회를 막지 못하므로 문서 규칙이 우선이다.
- 재검토 조건: Preview 용 DB 를 분리하면 Preview 와 의존성 자동 PR(dependabot npm) 정책을 다시 정한다.

### 3.16 검증 전략: 앱 테스트 대신 단계 검사

- 결정: `npm run verify` 하나가 검증 기준이다: prisma generate → tsc → eslint → content:check --strict → test:hooks → test:content → DB 차단 next build → smoke(tech 글 7개 기준 25개 경로의 상태 코드와 content-type, 페이지 메타와 JSON-LD, 404 본문, DB 와 무관한 서버 오류 로그). CI 도 이것 하나를 돌린다.
- 이유: 앱 로직이 얇고(파일 읽기, 렌더, 조회수 한 테이블) 깨지는 곳은 대부분 타입, 글 형식, 빌드, 라우트 응답이다. 1인 유지보수에서 컴포넌트 테스트는 비용이 크다.
- 버린 대안: 컴포넌트 단위 테스트, 시각 회귀 테스트, E2E.
- 결과·제약: 화면 모양, 클라이언트 상호작용(목차 스파이, 댓글 로그인, 히어로 캔버스), DB 가 살아 있을 때의 경로는 자동으로 검사하지 않는다. 화면은 `/run-app` 으로 사람이 본다. smoke 는 차단 DB 에서만 돈다.
- 재검토 조건: 같은 회귀가 두 번 나오면 그 부분에 테스트를 더한다.

### 3.17 Claude Code 전용 프로젝트

- 결정: 저장소 작업은 Claude Code 기준으로 정리한다: `CLAUDE.md`, 경로별 `.claude/rules/`, 스킬(`/new-post`, `/verify`, `/run-app`), 훅. `next.config.js` 의 `agentRules: false` 로 `AGENTS.md` 생성을 끈다.
- 이유: 혼자 쓰는 저장소에서 에이전트에게 맡기는 작업(글 초안, 리팩터링)이 많고, 운영 DB 안전 규칙을 강제할 곳이 필요하다.
- 버린 대안: 도구 중립 `AGENTS.md`.
- 결과·제약: 사실 하나는 문서 하나에만 둔다(이 문서, architecture.md, design.md, rules 가 서로 링크한다).
- 재검토 조건: 다른 에이전트 도구를 같이 쓰게 될 때.

## 4. 비목표

- 다국어, 다중 저자, 사이트 검색, 태그 필터 이상의 분류, CMS나 편집 UI.
- 정확한 분석(조회수는 근사), 사용자 계정, 서버 측 댓글 저장.
- 글 안의 인터랙티브 MDX 컴포넌트, raw HTML.
- 색상과 브랜드 컬러, 장식 오브젝트의 반복.
- log 의 상세 페이지와 마크다운 렌더.

## 5. 제약

- 공개된 slug 와 폴더는 바꾸지 않는다(조회수, 댓글, 외부 링크).
- 운영 DB 하나, 마이그레이션 이력 없음(`db push`). 컬럼 이름 오타 `createAt` 은 운영 컬럼이라 유지한다.
- Vercel(Node 24), GitHub 이미지 호스트만 허용, 빌드 때 Google Fonts 다운로드.
- 정적 경로에 DB 쿼리를 넣지 않는다.
- 1인 유지보수: 의존성과 코드를 늘리는 변경은 이유가 있어야 한다.

## 6. 알려진 부채

알려진 이슈 목록의 원본은 `CLAUDE.md` 와 각 rule 파일의 "알려진 이슈" 절이다. 여기에는 다시 적지 않는다.

## 7. 미룬 결정과 열린 질문

- 피드 크기 상한: 모든 tech 글의 전체 본문이 피드에 들어간다(지금 7개, 피드 하나 약 100KB). 글이 늘면 최근 N개만 본문을 넣을지 정한다. 피드 XML well-formed 검사를 smoke 에 넣을지도 정하지 않았다.
- Vercel 배포의 404: `next start` 에서는 `/tech/<없는 slug>` 가 `src/proxy.ts` 의 rewrite 로 루트 404 페이지(상태 404, `lang="ko"`)가 되고, 그 `opengraph-image` 도 404 다(smoke). Vercel 배포에서도 proxy 가 같은 404 를 내는지는 Preview 배포 뒤 `curl -i` 로 확인해야 한다. 200(soft 404)이거나 오류 셸이면 대응을 정한다.
- 원격 캐시 적중률: `'use cache: remote'` 가 Vercel 인스턴스 사이에서 실제로 적중하는지(Neon 쿼리 빈도)는 배포 뒤 로그로 확인한다.
- 비공개 저장소 이미지: `3d-interactive-multi-players-web-with-three.js-and-r3f` 글의 이미지 7개(모두 `github.com/blan19/3D_Interactive_Meta/assets/...`)는 GitHub 원본이 404 를 낸다. 원래 저장소가 비공개가 됐거나 첨부가 지워진 것으로 보인다. 글의 URL 을 고칠지 사용자 확인이 필요하다.
- CSP 강제 계획: 지금은 Report-Only 다. 배포본에서 홈, `/tech`, mermaid·이미지가 있는 글, 댓글을 열어 콘솔에 위반이 없는지 본 뒤 강제로 옮긴다(`next.config.js` 주석의 절차).

## 8. 큰 방향 변화 기록

`git log origin/main` 기준(PR 번호). 글 추가와 작은 수정은 뺐다.

| 시기 | 변화 |
|---|---|
| 2022-09 | Create Next App(Next 12)으로 저장소 시작 |
| 2023-12 | Next 12 → 14 이전(#2). Prisma 조회수(#4), 마크다운 파싱(#5), utterances 댓글(#10) |
| 2023-12 | 목록 정렬 방향을 여러 번 고침(#35, #38, #39). PPR 켬(#37) |
| 2024-02 | log 페이지 추가(#48) |
| 2026-10 | 의존성 최신화(#50), Claude Code 하네스와 `vercel-build` 분리(#51), 도메인 `www.blan19.xyz` 이전과 Node 24 고정(#54), 디렉터리 재편(#57) |
| 2026-10 | MARGIN 리디자인과 렌더러 교체(react-markdown/Prism → unified + 서버 Shiki)(#58) |
| 2026-10 | G3 회색조 "Minimal Index"(#59), UI 문구 정리(#60, #61), 히어로를 점묘 노트북으로(#61) |
| 2026-10 | canonical, 저자 메타, JSON-LD(#62). SEO 감사 반영: OG 공통값, JSON-LD `@graph`, `updatedAt`, 관련 글, `/llms.txt`, Pretendard 서브셋, 로컬 글 이미지, 누르는 영역 44px(#63) |
| 2026-10 | `refactor/architecture` 브랜치(아직 main 에 없음, #62·#63 위로 rebase): Cache Components 와 원격 캐시, 빌드 때 OG 이미지, 보안 헤더와 이미지 호스트 축소, 조회수 모듈 `views.ts` 통합(Server Action 제거), 피드에 전체 본문 HTML, 검사기·guard 훅 모듈 분리, 이 docs/ 문서 |
