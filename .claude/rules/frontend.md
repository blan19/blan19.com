---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/styles/**"
  - "next.config.js"
---

# 프론트엔드 규칙 (Next 16 App Router, React 19, Tailwind 4)

디자인 명세의 원본은 `design/implementation-plan.md`(토큰 값, 타입 스케일, 레이아웃 그리드)다. 값을 바꿀 때는 그 문서와 `design/proposals/b-margin.html` 을 기준으로 본다.

## CSS 와 Tailwind 4 (tailwind.config 없음)

- CSS 는 3파일이다. `src/styles/globals.css`(토큰, Tailwind 매핑, 요소 기본값, 공용 클래스, 헤더/푸터 크롬)가 `./markdown.css`(글 본문, 코드 블록, 콜아웃, 다이어그램, 이미지, 목차), `./pages.css`(홈, /tech, 글 머리와 글 끝, /log) 순서로 import 한다. 토큰(`:root`)은 레이어 밖, 요소 기본값은 `@layer base`, 나머지는 `@layer components`.
- 색은 CSS 변수 토큰이다(`:root` 에 라이트, 다크는 `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` 와 `:root[data-theme="dark"]` 두 곳에 같은 값으로 재정의). 다른 변수를 참조하는 파생 토큰(`--add-bg`, `--del-bg`)은 `:root` 에 한 번만 둔다. 새 색은 두 다크 블록에도 넣는다. 하드코딩 hex 는 `globals.css` 토큰, `src/lib/theme.ts` 의 `THEME_COLORS`(`--bg` 와 같은 값), OG 이미지(`src/app/og/route.tsx`)에만 둔다.
- `@theme inline { --color-*: initial; … }` 로 기본 팔레트를 지우고 토큰만 유틸리티로 연결했다: `bg`, `surface`, `text`, `body`, `muted`, `border`, `border-strong`, `accent`, `on-accent`, `accent-soft`, `marker`, `code-bg`, `code-inline-bg`, `note`, `tip`, `important`, `warning`, `caution`, `diff-add`, `diff-del`(예: `bg-surface`, `text-muted`, `border-border`). `white`, `black`, `red-500` 같은 클래스는 생성되지 않으며 오류도 나지 않는다. 폰트 `font-sans`/`font-serif`/`font-mono`, `ease-paper`, `rounded-code`, `rounded-box` 도 있다. 신택스 색(`--sh-*`)은 유틸리티가 없다.
- 색 토큰이 테마를 따라 바뀌므로 `dark:` 는 예외적으로만 쓴다(현재 코드 블록의 다크 전용 inset 테두리 하나, `markdown.css` 의 `@variant dark`). `dark` 는 커스텀 변형이라 시스템 다크와 강제 다크(`data-theme="dark"`) 둘 다에 걸리고 강제 라이트에서는 꺼진다.
- `hover:` 는 `@custom-variant hover (&:hover)` 로 v3 방식(터치 기기에서도 적용)이다.
- 브레이크포인트는 Tailwind 기본 그대로다. `md`(768px) 미만 모바일, `xl`(1280px) 이상에서 여백 레이아웃(왼쪽 목차/연도, 오른쪽 사이드노트/많이 읽힌 글). 레이아웃 컨테이너는 `.site-wrap`(660px, ≥1280 1212px) > `.site-col`(텍스트 열).
- 공용 클래스(`globals.css` 만 최상위로 정의): `.site-wrap`, `.site-col`, `.double-rule`, `.kicker`, `.page-title`, `.page-lede`, `.sec-title`, `.sec-head`, `.count-line`, `.text-link`, `.pen`, `.ext`, `.mono`, `.tnum`, `.btn-outline`, `.icon`, `.icon-btn`, `.seal`(+ `seal-sm|md|end|lg|xl`), `.wordmark`. `mark` 는 형광펜 스타일이다.
- 셀렉터 범위 규칙: `markdown.css` 와 `pages.css` 의 모든 규칙은 각 파일 머리 주석에 적힌 루트 클래스로 시작한다(`markdown.css`: `.post-body`, `.post-layout`, `.code-block`, `.callout`, `.diagram`, `.img-fig`, `.zoom-dlg`, `.toc-*` / `pages.css`: `.letter`, `.post-row`, `.most-read`, `.post-head`, `.end-sec`, `.end-label` 등). `.cnt`, `.views`, `.chev`, `.rule`, `.active`, `.read`, `.show`, `.pct`, `.go`, `.lede` 같은 범용 이름은 루트의 후손으로만 쓴다. `.hl` 은 쓰지 않는다: 코드 줄은 `.line-hl`/`.line-add`/`.line-del`, 목록 제목 형광펜은 `.title-hl`.
- 각주 라벨 `h2.end-label` 이 `.post-body` 안에 생긴다. 본문 h2 규칙은 `.post-body h2:not(.end-label)` 로 쓴다. `.end-label`/`.end-sec` 의 모양은 `pages.css` 만 정의한다.
- 클래스 이름 금지 목록: Tailwind 4 는 소스에서 찾은 문자열을 유틸리티로 만들기 때문에 커스텀 클래스가 유틸리티 이름과 겹치면 안 된다. `ring`, `shadow`, `collapse`, `contents`, `table`, `grid`, `flex`, `hidden`, `block`, `inline`, `container`, `truncate`, `italic`, `underline`, `border`, `rounded`, `static`, `fixed`, `sticky`, `relative`, `absolute`, `visible`, `invisible`, `prose`, `outline`, `filter`, `blur`, `invert`, `uppercase`, `lowercase`, `capitalize`, `isolate`, `ordinal`, `transform`, `transition`, `col`, `row` 를 커스텀 클래스로 쓰지 않는다(목업의 `.wrap`→`.site-wrap`, `.col`→`.site-col`, `.row`→`.post-row`, `.code`→`.code-block`, `.ring`→`.toc-pill-ring`). `sr-only` 는 Tailwind 것을 쓴다.
- Preflight 주의: `ol, ul { list-style: none }`, 헤딩 `font-size: inherit`, `a { color: inherit; text-decoration: inherit }`, `img { display: block }` 이 걸려 있다. 글 본문 CSS 는 목록 마커, 링크 밑줄, 헤딩 크기를 전부 명시한다. `@tailwindcss/typography`(`.prose`)는 쓰지 않는다.
- 클래스 이름은 소스에 문자열 그대로 써야 감지된다. `` `text-${size}` `` 같은 동적 조합은 생성되지 않는다(`seal-${size}` 처럼 CSS 파일에 직접 정의한 클래스는 괜찮다).
- `markdown.css` 의 마크다운 출력 루트 직계는 p, h2–h5, ul, ol, figure, aside, blockquote, div.table-wrap, hr, section.footnotes 뿐이다. 직계 선택자(`>`)는 블록 리듬에만 쓰고 나머지는 후손 선택자로 쓴다. `.post-body` 와 그 조상에 `overflow: hidden` 을 두지 않는다(사이드노트 float 이 잘린다).

## 폰트 (`src/app/fonts.ts`, layout 의 `<html>` className)

- `pretendard`: `next/font/local`, `src/fonts/PretendardVariable.woff2`(가변 1개, weight 45–920, preload) → `--font-pretendard`. 본문과 UI.
- `notoSerifKr`: `next/font/google` Noto Serif KR 600/700, `preload: false` → `--font-noto-serif-kr`.
- `plexMono`: `next/font/google` IBM Plex Mono 400/500 → `--font-plex-mono`. 날짜, 번호, 코드, 메타.
- CSS 는 `--sans`, `--serif`, `--mono` 스택(`globals.css` `:root`)을 쓴다. 빌드 때 Google Fonts 를 내려받으므로 오프라인에서는 `next build` 가 실패한다.
- 세리프는 4곳에만 쓴다: h1(모든 페이지), h2(글 본문, 홈/로그 섹션 제목, 로그 항목 제목), 홈 hero 문장(`.letter-lead`), blockquote(글 본문 인용, 홈 로그 카드). 워드마크, 작성자 이름, h3 이하, UI 는 Pretendard, 목록 번호·연도·순위 숫자는 Plex Mono 다. `.serif` 유틸리티 클래스는 만들지 않는다.
- 한글 `italic` 은 쓰지 않는다(`em` 은 굵기 600 으로 표시).

## 테마 (system / light / dark)

- `src/app/layout.tsx` 의 `<head>` 인라인 스크립트(`THEME_INIT`)가 첫 페인트 전에 `<html>` 에 `data-js`(JS 있음 표시)를 붙이고, localStorage `theme` 가 `light`/`dark` 면 `data-theme` 를 붙인다. system 은 속성 없이 CSS 미디어쿼리가 처리한다. `<html suppressHydrationWarning>` 이다.
- `src/lib/theme.ts`(브라우저 전용 함수, `"use client"` 아님. 서버에서 import 해도 호출하지 않으면 안전): `ThemePref`, `ResolvedTheme`, `THEME_STORAGE_KEY`("theme", 인라인 스크립트와 같은 값), `THEME_EVENT`(`blan19:themechange`), `THEME_COLORS`, `readThemePref`, `resolveTheme`, `syncThemeColor`, `setThemePref`, `subscribeResolvedTheme`. 저장 키를 바꾸면 `THEME_INIT` 도 바꾼다.
- `ui/theme-toggle` 은 `useSyncExternalStore`(서버 스냅샷 "system")로 설정을 읽고 `setThemePref` 로 바꾼다. 테마에 따른 색은 전부 CSS 변수로 처리하고 React 상태로 계산하지 않는다. CSS 로 못 바꾸는 것(mermaid, utterances iframe)만 `subscribeResolvedTheme` 로 따라간다.
- `viewport.themeColor` 의 두 `<meta name="theme-color">` 는 OS 설정만 따르므로 `syncThemeColor` 가 강제 테마일 때 덮어쓴다(`setThemePref` 안, 토글 마운트 때 1회).
- `[data-js]` 는 JS 가 있을 때만 켜지는 CSS(코드 블록 접힘과 "전체 보기" 버튼)에 쓴다. JS 가 없으면 코드 전체가 보인다.

## 글 렌더러 (`src/lib/markdown/`, `ui/post-body`)

- `renderMarkdown(key, markdown)`(`index.ts`, 서버 전용)이 unified 로 HAST 를 만들어 `{ hast, toc }` 를 돌려준다. 모듈 `Map` 캐시(키 `${slug}:${sha1(본문)}`, 50개, 실패한 promise 는 지움). `ui/post-body` 가 `hast-util-to-jsx-runtime` 으로 렌더하고 `figure`/`aside`/`a`/`img` 만 컴포넌트로 바꾼다(`components` 맵은 모듈 상수).
- 플러그인 순서: `remark-parse` → `remark-gfm` → `remark-shift-headings` → `remark-alerts` → `remark-rehype`(`allowDangerousHtml`, 각주 라벨 "각주" `h2.end-label`) → `rehype-raw-to-text` → `rehype-safe-urls` → `rehype-image-figures` → `rehype-code-blocks`(async) → `rehype-tables` → `rehype-slug` → `rehype-collect-toc` → `rehype-heading-anchors` → `rehype-sidenotes` → `rehype-footnote-section`. 커스텀 플러그인은 파일 하나에 하나, 이름 = 파일명.
- raw HTML 은 렌더하지 않는다(`raw` 노드를 같은 글자의 텍스트로 바꾼다). `a[href]`, `img[src]` 는 react-markdown `defaultUrlTransform` 규칙을 따른다: 콜론이 없거나 첫 콜론이 첫 `/`·`?`·`#` 보다 뒤면(상대 URL) 그대로, 그 밖에는 http, https, mailto 만 남기고 나머지(`javascript:` 등)는 빈 값.
- 헤딩: `#`·`##`·`###` → h2, `####` → h3, `#####` → h4, `######` → h5(h1 은 페이지 제목 하나). id 는 `rehype-slug`(github-slugger, 중복은 `-1`). 목차(`TocItem`, h2·h3)는 같은 HAST 에서 id 를 그대로 읽으므로 앵커와 어긋나지 않는다. 글 페이지의 고정 id(`main`, `post-head`, `post-body`, `footnote-label`, `ref-label`, `cm-label`)와 같은 제목 id 는 검사기가 warn 한다(`validate-content.mjs` 의 `FIXED_PAGE_IDS`). 고정 id 를 새로 넣거나 바꾸면 그 목록도 고친다. 목차 레일은 `aside.toc-rail > nav[aria-label="목차"]`(라벨은 nav 에), 건너뛰기 링크 대상 `<main id="main" tabIndex={-1}>`(포커스 테두리는 `globals.css` 에서 끔). h2–h4 끝의 `a.anchor`("#")는 `aria-hidden` + `tabIndex -1` 이다(헤딩 이름을 바꾸지 않는다).
- 코드 블록: Shiki(`shiki.ts`, `shiki/core` + JS 정규식 엔진, wasm 없음, 서버 전용, 모듈 싱글턴을 import 때 시작). 테마 `blan19` 는 토큰 색이 `var(--sh-*)` 라 라이트/다크 전환은 CSS 변수 교체뿐이다. `pre > code` 를 `figure.code-block`(`data-lang`, `data-title`, `data-lines`, `data-ln`, `data-diff`, `data-prompt`, `data-collapsible`, `data-wide`)로 바꾸고 `ui/code-block` 이 헤더(파일명/언어, 복사 버튼)와 접힘을 그린다. 같은 (lang, meta, code) 는 하이라이트 결과를 재사용한다. 하이라이트가 실패하면 그 블록만 `text` 로 다시 그리고 `[markdown] …` 로그를 남긴다(글 전체가 `error.tsx` 로 가지 않는다). 빈 `title=""` 은 title 없음으로 본다.
  - meta: `title="파일명"`, `{4-6}`/`{1,3-5}`(줄 하이라이트), `showLineNumbers`. 줄 안 표기: `// [!code ++]`, `// [!code --]`, `// [!code highlight]`(Shiki notation transformer).
  - 자동: 12줄 이상이면 줄 번호, 30줄 초과면 접힘(JS 있을 때), 72자 초과 줄이 있으면 ≥1280 에서 오른쪽으로 넓힘, bash 는 명령 줄 앞 `$`(줄 번호·diff 가 없고 디렉터리 트리가 아닐 때).
  - 줄 번호, diff 기호(+/−), `$` 는 빈 `span.gutter` 의 CSS 생성 콘텐츠라 선택·복사에 들어가지 않는다. gutter transformer 는 반드시 마지막이고 `line()` 이 아니라 `code()` 훅에서 줄을 고친다(`line()` 에서 넣으면 notation 처리가 터진다). `pre code { display: grid }` 라 줄 사이 개행 텍스트가 빈 줄로 보이지 않는다.
  - 언어 목록의 원본은 `languages.ts`(`CODE_LANGUAGES` 13개, `LANGUAGE_ALIASES`, `PLAIN_LANGUAGES`, `DIAGRAM_LANGUAGES`)다. 검사기(`scripts/validate-content.mjs`)가 이 파일을 정규식으로 읽으므로 형식(큰따옴표, 한 줄에 하나)을 바꾸지 않는다. 언어를 추가하면 `shiki.ts` 의 `langs` 에도 `import("shiki/langs/<lang>.mjs")` 를 문자열 리터럴로 한 줄 추가한다(템플릿 문자열로 쓰면 번들러가 `shiki/langs` 전체를 묶는다). `languages.ts`, `types.ts` 에는 `server-only` 를 넣지 않는다(검사기와 클라이언트 컴포넌트가 읽는다).
- 콜아웃: `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` 만 `aside.callout`(`ui/callout`, 라벨 참고/팁/중요/주의/경고 + 아이콘)이 된다. 첫 문단이 `**제목**` 뒤 줄바꿈이면 제목(`.callout-title`)으로 승격한다. 마커 없는 `>` 는 일반 인용(세리프)이다.
- mermaid: ```` ```mermaid ```` 펜스는 `figure.diagram` → `ui/mermaid`(클라이언트). 화면 근처에 오면 `import("mermaid")` 로 지연 로드하고, CSS 토큰으로 테마를 만들고, 테마나 모바일 여부가 바뀌면 다시 그린다. 모바일(<768)에서는 `flowchart|graph LR|RL` 을 `TD` 로 바꿔 그린다. mermaid 펜스가 없는 글은 mermaid 청크를 받지 않는다. `securityLevel: "strict"`.
- 각주/사이드노트: GFM 각주는 글 끝 `section.footnotes`(라벨 "각주")가 정본이다. `rehype-sidenotes` 가 각주 정의를 첫 참조가 있는 문단(p, li) 안에 `span.sidenote[aria-hidden]` 으로 복제하고 ≥1280 에서만 CSS float 로 오른쪽 여백에 보인다(JS 없음). 콜아웃, 인용, 표, 그림, 헤딩 안의 참조와 블록 콘텐츠를 가진 각주는 사이드노트를 만들지 않는다.
- 이미지: 루트 직계 문단 중 첫 자식이 `img` 인 것을 `figure.img-fig` → `ui/post-image`(next/image, 클릭 확대 dialog, 로드 실패 시 대체 박스)로 바꾼다(문단의 나머지 내용은 버린다). alt 메타(`{priority}`, `{caption: …}`, `{WxH}`)는 이전과 같은 정규식이다. `{priority}` 는 글의 첫 이미지일 때만 적용한다. 형식을 바꾸면 기존 글 전부와 검사기의 `checkImageMeta` 도 함께 바꾼다. 문단 중간 이미지는 지연 로드하는 일반 `img` 다.
- 링크: `https://www.blan19.xyz`/`https://blan19.xyz` 링크는 경로만 남겨 `next/link`, 그 밖의 http(s) 는 새 탭 + `.ext`(↗). 표는 가로 스크롤 영역(`div.table-wrap > div.table-scroll[role=region]`)으로 감싼다.
- `/log` 는 이 렌더러를 쓰지 않는다(원문 문단을 그대로 출력).

## 컴포넌트

- 기본은 Server Component 다. `"use client"` 는 `src/app/error.tsx`, `ui/nav-links`(usePathname), `ui/theme-toggle`, `ui/copy-button`, `ui/code-fold`, `ui/mermaid`, `ui/post-image`, `ui/toc-spy`, `ui/comment`(utterances), `ui/copy-link` 뿐이다. 클라이언트 경계는 최소로 유지한다. `ui/icon` 은 훅이 없어 양쪽에서 쓴다.
- 클라이언트 컴포넌트 린트: `eslint-config-next` 의 `react-hooks/set-state-in-effect`, `refs`, `purity`, `globals`, `immutability`, `static-components` 가 error 다. effect 본문에서 `setState` 를 바로 부르지 않고(이벤트 핸들러, `await` 뒤, observer/rAF/`setTimeout`/구독 콜백 안에서만), 외부 값(테마 설정, matchMedia)은 `useSyncExternalStore` 로 읽고, props 변경 리셋은 부모의 `key` 로 한다. 렌더 중 `ref.current` 읽기/쓰기, `Date.now()`/`Math.random()`, 렌더 함수 안 컴포넌트 정의를 하지 않는다. `ui/toc-spy` 는 활성 항목과 진행률을 React 상태가 아니라 DOM 에 직접 쓴다.
- 글 간 이동(`/tech/a` → `/tech/b`) 때 Next 가 페이지 세그먼트를 다시 마운트하므로 `TocSpy`, `Mermaid` 는 새 인스턴스로 시작한다. 댓글은 `<Comment key={slug} />` 로 쓴다(utterances 스크립트를 넣고 정리 때 비운다, 테마는 postMessage 로 따라간다).
- `src/lib/db/action.ts`, `queries.ts` 는 `"use server"` 파일이다. Client Component 에서 import 하면 export 가 공개 POST 엔드포인트가 된다(`increment` 를 누구나 호출 가능). 클라이언트에서 import 하지 않는다.
- DB 를 읽는 컴포넌트는 `ui/view-count`(`ArticleViews`, `RowViews`, fallback `ViewsPending`)와 `ui/most-read`(`MostRead`, fallback `MostReadPending`)의 패턴을 따른다: `<Suspense>` 안에서만 쓰고, `await connection()` 은 try 밖, 쿼리만 try/catch, catch 첫 줄 `unstable_rethrow(error)` 후 `null`. `RowViews` 는 로그를 남기지 않는다: React `cache` 인 `getViewMap`(`src/lib/views.ts`)이 실패를 요청당 한 번 로그하고 다시 던진다(행마다 같은 오류가 찍히지 않게). 실패하면 그 칸이나 섹션만 사라진다(`app/error.tsx` 는 진짜 버그용).
- 서버 전용 모듈(`src/lib/posts.ts`, `views.ts`, `markdown/index.ts`, `markdown/shiki.ts`)은 첫 줄 `import "server-only";` 다.
- Next 16: 페이지와 `generateMetadata` 의 `params`/`searchParams` 는 `Promise` 타입이고 `await` 한다. route handler 에도 같은 규칙이 적용된다. `error.tsx` 는 `retry` prop 을 받는다.
- 이미지는 `next/image` 를 쓴다. 원격 호스트는 `next.config.js` 의 `images.remotePatterns` 에 있어야 한다. 호스트를 추가하면 검사기도 자동으로 따라간다(설정을 require 함).
- 메타데이터는 `export const metadata` / `generateMetadata` / `export const viewport` 를 쓴다(RSS `<link>` 는 `metadata.alternates.types`). `next/head` 는 App Router 에서 동작하지 않는다.
- 사이트 URL 은 `src/lib/config.ts` 의 `url`(`https://www.blan19.xyz/`, 끝 `/` 포함) 하나다. layout(metadataBase), robots, sitemap, `tech/[slug]`, RSS 가 모두 이 값을 쓰니 경로는 `${config.url}tech/...` 처럼 앞에 `/` 없이 붙인다. 2026-10 에 `blan19.com` 에서 옮겼고 옛 도메인은 리다이렉트할 수 없다. 같은 때 GitHub 저장소도 `blan19/blan19.xyz` 로 이름을 바꿨다. utterances(`src/components/ui/comment`)와 글의 GitHub 첨부 이미지 URL 은 새 이름을 쓴다. 옛 이름(`blan19/blan19.com`)도 GitHub 리다이렉트로 동작하지만 새로 쓰지 않는다.
- OG 이미지(`src/app/og/route.tsx`)는 번들한 `Pretendard-Bold.woff`(satori 는 woff2 를 못 읽는다)와, 요청한 글자만 Google Fonts 에서 받는 Noto Serif KR 700(2.5초 타임아웃, 실패하면 Pretendard 만)으로 그린다. 네트워크가 없어도 PNG 는 나온다.
- UI 문구는 한국어로 쓴다(코드 라벨, 날짜 같은 기술 표기는 예외).

## 알려진 이슈 (요청 없이 고치지 말 것)

- OG 이미지 URL 의 title 을 인코딩하지 않는다(`tech/[slug]/page.tsx`).
- 헤딩 id 가 github-slugger 형식(소문자, 공백 → `-`, 대부분의 기호 제거)이라, 이전 렌더러의 원문 텍스트 id 로 만든 외부 `#…` 링크는 페이지 맨 위로 떨어진다.

화면 확인은 `/run-app` 으로 한다(DB 차단). 검증 순서는 CLAUDE.md 의 작업 규칙을 따른다.
